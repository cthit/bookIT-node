import moment from "moment";

export const formatDT = date => {
  if (Number.isNaN(Number.parseInt(date)))
    return moment(date).format("yyyy-MM-DD HH:mm");
  return moment(new Date(Number.parseInt(date))).format("yyyy-MM-DD HH:mm");
};
export const formatDate = date => moment(date).format("yyyy-MM-DD");
export const formatTime = date => moment(date).format("HH:mm");

// Returns true if one or more items are equal in a and b
export const overlap = (a, b) => {
  for (const i in b) {
    if (a.includes(b[i])) {
      return true;
    }
  }
  return false;
};
