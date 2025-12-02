import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

// 테스트케이스 목록 조회
export async function getTestCases(req: Request, res: Response): Promise<void> {
  try {
    const { folderId } = req.query;
    const where = folderId ? { folderId: String(folderId) } : {};

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: { sequence: 'asc' }
    });

    res.json({ success: true, data: testCases });
  } catch (error) {
    console.error('Get testcases error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 조회 실패' });
  }
}

// 테스트케이스 생성
export async function createTestCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, precondition, steps, expectedResult, priority, folderId } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: '제목은 필수입니다.' });
      return;
    }

    // 같은 폴더 내의 마지막 sequence 조회
    const lastCase = await prisma.testCase.findFirst({
      where: { folderId: folderId || null },
      orderBy: { sequence: 'desc' }
    });
    const nextSequence = (lastCase?.sequence || 0) + 1;

    const testCase = await prisma.testCase.create({
      data: {
        title,
        description,
        precondition,
        steps,
        expectedResult,
        priority: priority || 'MEDIUM',
        folderId: folderId || null,
        sequence: nextSequence
      }
    });

    res.status(201).json({ success: true, data: testCase });
  } catch (error) {
    console.error('Create testcase error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 생성 실패' });
  }
}

// CSV Import
export async function importTestCases(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'CSV 파일이 필요합니다.' });
      return;
    }

    const { folderId, mapping } = req.body;
    const headerMapping = mapping ? JSON.parse(mapping) : {};

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as any[];

    let successCount = 0;
    let failureCount = 0;
    const failures: any[] = [];

    const lastCase = await prisma.testCase.findFirst({
      where: { folderId: folderId || null },
      orderBy: { sequence: 'desc' }
    });
    let currentSequence = (lastCase?.sequence || 0);

    const testCasesToCreate = [];

    for (const [index, row] of records.entries()) {
      try {
        const testCaseData: any = {
          folderId: folderId || null,
          priority: 'MEDIUM'
        };

        const dbFields = ['title', 'description', 'precondition', 'steps', 'expectedResult', 'priority'];
        
        if (Object.keys(headerMapping).length > 0) {
           for (const [csvHeader, dbField] of Object.entries(headerMapping)) {
             if (row[csvHeader]) {
               testCaseData[dbField as string] = row[csvHeader];
             }
           }
        } else {
          for (const field of dbFields) {
            if (row[field]) testCaseData[field] = row[field];
          }
        }

        if (!testCaseData.title) {
          throw new Error('제목(title)이 누락되었습니다.');
        }

        currentSequence += 1;
        testCaseData.sequence = currentSequence;
        
        testCasesToCreate.push(testCaseData);
        successCount++;
      } catch (err: any) {
        failureCount++;
        failures.push({ row: index + 2, message: err.message, data: row });
      }
    }

    if (testCasesToCreate.length > 0) {
      await prisma.testCase.createMany({
        data: testCasesToCreate
      });
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        successCount,
        failureCount,
        failures
      }
    });

  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({ success: false, message: 'CSV Import 실패' });
  }
}

// 테스트케이스 수정
export async function updateTestCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, precondition, steps, expectedResult, priority } = req.body;

    const existingCase = await prisma.testCase.findUnique({ where: { id } });
    if (!existingCase) {
      res.status(404).json({ success: false, message: '테스트케이스를 찾을 수 없습니다.' });
      return;
    }

    const updatedCase = await prisma.testCase.update({
      where: { id },
      data: {
        title,
        description,
        precondition,
        steps,
        expectedResult,
        priority
      }
    });

    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Update testcase error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 수정 실패' });
  }
}

// 테스트케이스 삭제
export async function deleteTestCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existingCase = await prisma.testCase.findUnique({ where: { id } });
    if (!existingCase) {
      res.status(404).json({ success: false, message: '테스트케이스를 찾을 수 없습니다.' });
      return;
    }

    await prisma.$transaction([
      prisma.planItem.deleteMany({ where: { testCaseId: id } }),
      prisma.testCase.delete({ where: { id } })
    ]);

    res.json({ success: true, message: '테스트케이스가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete testcase error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 삭제 실패' });
  }
}
