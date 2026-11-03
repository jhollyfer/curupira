import db from '@adonisjs/lucid/services/db'

import CollectionScheduleModel from '#models/collection-schedule'
import NeighborhoodModel from '#models/neighborhood'
import NoticeModel from '#models/notice'
import ReportModel from '#models/report'
import ReportPhotoModel from '#models/report-photo'
import ReportStatusEventModel from '#models/report-status-event'
import StorageModel from '#models/storage'
import UserModel from '#models/user'

/**
 * What was left stored in the database, read for the "saved" / "not saved" assertion
 * (`_standards/backend.md` §7). A `features/` spec does not import a model
 * (`architecture.md` §2): the e2e checks the state through here, and seeds through
 * the `database/factories/` factories.
 *
 * `x(id)` returns `null` when the row does not exist; `xOrFail` fails the test.
 */
export class Stored {
  static neighborhood(id: string) {
    return NeighborhoodModel.find(id)
  }

  static neighborhoodByName(name: string) {
    return NeighborhoodModel.findBy('name', name)
  }

  static neighborhoodOrFail(id: string) {
    return NeighborhoodModel.findOrFail(id)
  }

  static schedule(id: string) {
    return CollectionScheduleModel.find(id)
  }

  static schedulesOfNeighborhood(neighborhoodId: string) {
    return CollectionScheduleModel.query().where(
      'neighborhoodId',
      neighborhoodId,
    )
  }

  static notice(id: string) {
    return NoticeModel.find(id)
  }

  static noticeOrFail(id: string) {
    return NoticeModel.findOrFail(id)
  }

  static report(id: string) {
    return ReportModel.find(id)
  }

  static reportByProtocol(protocol: string) {
    return ReportModel.findBy('protocol', protocol)
  }

  static reportOrFail(id: string) {
    return ReportModel.findOrFail(id)
  }

  static reports() {
    return ReportModel.all()
  }

  static eventsOfReport(reportId: string) {
    return ReportStatusEventModel.query()
      .where('reportId', reportId)
      .orderBy('at', 'asc')
  }

  /** Links an uploaded file to a report, as saving the report does. */
  static attachPhoto(reportId: string, storageId: string, position = 0) {
    return ReportPhotoModel.create({ reportId, storageId, position })
  }

  static photosOfReport(reportId: string) {
    return ReportPhotoModel.query().where('reportId', reportId)
  }

  static storageOrFail(id: string) {
    return StorageModel.findOrFail(id)
  }

  static storages() {
    return StorageModel.all()
  }

  static storage(id: string) {
    return StorageModel.find(id)
  }

  static user(id: string) {
    return UserModel.find(id)
  }

  static userByEmail(email: string) {
    return UserModel.findBy('email', email)
  }

  static users() {
    return UserModel.all()
  }

  /** Empties `users`, for the specs whose subject is the database with nobody in it. */
  static async removeAllUsers(): Promise<void> {
    await UserModel.query().delete()
  }

  /** Throws when the credentials do not match, as the sign-in does. */
  static verifyCredentials(email: string, password: string) {
    return UserModel.verifyCredentials(email, password)
  }

  static userByEmailOrFail(email: string) {
    return UserModel.findByOrFail('email', email)
  }

  static userOrFail(id: string) {
    return UserModel.findOrFail(id)
  }

  /** Opens a session for the account, as the sign-in does. */
  static issueToken(user: UserModel) {
    return UserModel.accessTokens.create(user)
  }

  /** The keys the rate limiter has stored, as the package keeps them (no model). */
  static async rateLimitKeys(): Promise<string[]> {
    const rows = await db.from('rate_limits').select('key')

    return rows.map((row) => String(row.key))
  }
}
