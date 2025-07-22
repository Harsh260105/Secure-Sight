/*
  Warnings:

  - Added the required column `thumbnail_url` to the `cameras` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cameras" ADD COLUMN     "thumbnail_url" TEXT NOT NULL;
