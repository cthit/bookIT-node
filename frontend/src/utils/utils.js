import moment from "moment";

export const formatDT = date => {
	if(Number.isNaN(Number.parseInt(date)))
		return moment(date).format("yyyy-MM-DD HH:mm");
	return moment(Date(Number.parseInt(date))).format("yyyy-MM-DD HH:mm");
}
export const formatDate = date => moment(date).format("yyyy-MM-DD");
export const formatTime = date => moment(date).format("HH:mm");
