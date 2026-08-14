import { AssignmentStatus } from '@prisma/client';
import { AppError, ErrorCodes } from '../../utils/errors';
import { prisma } from '../../infrastructure/database/prisma';
import { buildPaginatedResult, getSkip } from '../../utils/pagination';

export class StudentService {
  async createStudent(
    schoolId: string,
    data: { parentId: string; firstName: string; lastName: string; grade?: string; section?: string }
  ) {
    const parent = await prisma.parentProfile.findFirst({
      where: { id: data.parentId, user: { schoolId } },
    });

    if (!parent) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Parent not found', 404);
    }

    return prisma.student.create({
      data: {
        schoolId,
        parentId: data.parentId,
        firstName: data.firstName,
        lastName: data.lastName,
        grade: data.grade,
        section: data.section,
      },
    });
  }

  async listStudents(
    schoolId: string,
    page: number,
    limit: number,
    filters?: { search?: string; grade?: string; parentId?: string; routeId?: string; isActive?: boolean }
  ) {
    const where = {
      schoolId,
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.grade && { grade: filters.grade }),
      ...(filters?.parentId && { parentId: filters.parentId }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' as const } },
          { lastName: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(filters?.routeId && {
        assignments: { some: { routeId: filters.routeId, status: AssignmentStatus.ACTIVE } },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        include: {
          parent: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          assignments: {
            where: { status: 'ACTIVE' },
            include: { route: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return buildPaginatedResult(items, total, { page, limit });
  }

  async getStudent(schoolId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        parent: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
        assignments: {
          include: {
            route: { select: { id: true, name: true } },
            pickupStop: true,
            dropStop: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Student not found', 404);
    }
    return student;
  }

  async updateStudent(schoolId: string, studentId: string, data: Record<string, unknown>) {
    await this.getStudent(schoolId, studentId);
    return prisma.student.update({ where: { id: studentId }, data });
  }

  async deactivateStudent(schoolId: string, studentId: string) {
    await this.getStudent(schoolId, studentId);

    await prisma.$transaction([
      prisma.student.update({ where: { id: studentId }, data: { isActive: false } }),
      prisma.studentRouteAssignment.updateMany({
        where: { studentId, status: 'ACTIVE' },
        data: { status: 'INACTIVE', effectiveTo: new Date() },
      }),
    ]);
  }

  async assignToRoute(
    schoolId: string,
    studentId: string,
    data: { routeId: string; pickupStopId: string; dropStopId: string }
  ) {
    const student = await this.getStudent(schoolId, studentId);
    if (!student.isActive) {
      throw new AppError(ErrorCodes.INACTIVE_RESOURCE, 'Student is inactive', 422);
    }

    const route = await prisma.route.findFirst({
      where: { id: data.routeId, schoolId, status: 'ACTIVE' },
      include: { stops: true },
    });

    if (!route) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Route not found', 404);
    }

    const stopIds = new Set(route.stops.map((s) => s.id));
    if (!stopIds.has(data.pickupStopId) || !stopIds.has(data.dropStopId)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Stops must belong to the route', 400);
    }

    await prisma.studentRouteAssignment.updateMany({
      where: { studentId, status: 'ACTIVE' },
      data: { status: 'INACTIVE', effectiveTo: new Date() },
    });

    return prisma.studentRouteAssignment.create({
      data: {
        studentId,
        routeId: data.routeId,
        pickupStopId: data.pickupStopId,
        dropStopId: data.dropStopId,
      },
      include: { pickupStop: true, dropStop: true, route: { select: { id: true, name: true } } },
    });
  }

  async listAssignments(schoolId: string, studentId: string) {
    await this.getStudent(schoolId, studentId);

    return prisma.studentRouteAssignment.findMany({
      where: { studentId },
      include: {
        route: { select: { id: true, name: true } },
        pickupStop: true,
        dropStop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeAssignment(schoolId: string, studentId: string, assignmentId: string) {
    await this.getStudent(schoolId, studentId);

    const assignment = await prisma.studentRouteAssignment.findFirst({
      where: { id: assignmentId, studentId },
    });

    if (!assignment) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Assignment not found', 404);
    }

    await prisma.studentRouteAssignment.update({
      where: { id: assignmentId },
      data: { status: 'INACTIVE', effectiveTo: new Date() },
    });
  }
}
