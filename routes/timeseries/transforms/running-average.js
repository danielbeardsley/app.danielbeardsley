module.exports = {
  runningAverage: function (seconds) {
    // One way linked list of records
    let head = null;
    // Tail of the list, always pointing at the record just behind our running
    // average
    let tail = null;

    return function(record) {
      appendToHead(record)
      advanceTail();
      const interpolatedRecord = interpolate(record);
      return integralAverage(interpolatedRecord);
    }

    function appendToHead(record) {
      const next = { record };
      if (!head) {
        head = tail = next;
      } else {
        head.next = next;
        head = next;
      }
    }

    function advanceTail() {
      while (tail.next && secondsBetween(tail.next.record, head.record) > seconds) {
        tail = tail.next;
      }
    }

    function interpolate(record) {
      if (!tail.next) {
        return { record };
      }
      const start = tail.record;
      const end = tail.next.record;

      const between = record.timestamp - seconds;
      if (between < start.timestamp) {
        return tail;
      }
      const distance = secondsBetween(start, end);
      const normalizedDistance = (between - start.timestamp) / distance;
      const valueDelta = end.value - start.value;
      return {
        record: {
          timestamp: between,
          value: start.value + valueDelta * normalizedDistance,
        },
        next: tail.next,
      }
    }

    function integralAverage(from) {
      if (!from.next) {
        return from.record.value;
      }
      let sum = 0;
      let current = from;
      while (current.next) {
        const start = current.record;
        const end = current.next.record;
        sum += ((start.value + end.value) / 2) * secondsBetween(start, end);
        current = current.next;
      }
      return sum / (current.record.timestamp - from.record.timestamp);
    }
  }
};

function secondsBetween(recordFrom, recordTo) {
  return recordTo.timestamp - recordFrom.timestamp;
}

