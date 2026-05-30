-- Fix Review_ratingId_fkey: change ON DELETE CASCADE → ON DELETE SET NULL
-- so deleting a Rating clears the review's ratingId instead of deleting the review

ALTER TABLE "Review" DROP CONSTRAINT "Review_ratingId_fkey";

ALTER TABLE "Review" ADD CONSTRAINT "Review_ratingId_fkey"
  FOREIGN KEY ("ratingId") REFERENCES "Rating"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
