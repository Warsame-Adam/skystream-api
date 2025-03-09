// Convert input to a valid Date object (supports both timestamp and ISO string)
const parseDate = (input) => {
  if (!input) return null;

  let date = new Date(input); // Works for both timestamps & ISO strings

  // If input is a number (timestamp), ensure it's correctly converted
  if (!isNaN(input) && typeof input === "number") {
    date = new Date(Number(input));
  }

  return isNaN(date.getTime()) ? null : date;
};

export default parseDate;
