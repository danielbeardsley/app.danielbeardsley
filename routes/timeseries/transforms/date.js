module.exports = {
  getLocalizedDate: function (locale, timezone) {
    const date = new Date();
    const test = date.toLocaleString(locale, {timeZone: timezone});
    return function(record) {
      const date = new Date(record.timestamp * 1000);
      return date.toLocaleString(locale, {timeZone: timezone});
    }
  }
}

