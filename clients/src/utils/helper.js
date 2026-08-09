export function checkIsValid(obj) {
  const ivl = [];
  for (const prop in obj) {
    if (obj[prop] === '') {
      ivl.push(prop);
    }
  }
  return ivl.length >= 5;
}
