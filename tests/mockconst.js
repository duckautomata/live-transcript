/**
 * NOTE:
 * The tests require at least 2 pages of transcript lines in order for the pagination tests to work.
 * Best to keep the number of searchTerm results < 5 since virtual lists do not show all results. Best if 1-3 results.
 * searchLineId just needs to be one of the searchTerm results, order doesn't matter.
 */

export const keyName = "test";
export const title = "just kidding I'm getting filtered";
export const searchTerm = "dam";
export const searchTermSize = 2;
export const emptyLineId = 399;
export const searchLineId = 154;

export const paginationSearchTop = "Yeah, you guys listen to the your idol cover";
export const paginationTopLineId = 99;
export const paginationSearchBottom =
    "We all did our best. I did my best with the I tried with the rap. I tried I'm pretty happy with how";
export const paginationBottomLineId = 100;
export const paginationSearchMiddle = "Two streams or so. That sounds pretty reasonable, they say. How long to be?";
export const paginationMiddleLineId = 266;
