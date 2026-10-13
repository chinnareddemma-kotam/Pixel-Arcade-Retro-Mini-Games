(() => {
  const KEY = "pixelArcade.records.v1";

  const defaults = {
    snakeBest: 0,
    memoryBest: 0,
    reactionBest: null,
    tttWins: 0,
    swanBest: 0,
    flappyBest: 0,
    cupBest: 0
  };

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");

      return {
        ...defaults,
        ...saved
      };
    } catch (error) {
      console.warn("Could not read arcade records:", error);
      return { ...defaults };
    }
  }

  let records = read();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(records));
    } catch (error) {
      console.warn("Could not save arcade records:", error);
    }

    window.dispatchEvent(
      new CustomEvent("arcade:records", {
        detail: { ...records }
      })
    );
  }

  window.ArcadeStorage = {
    get() {
      return { ...records };
    },

    setBest(key, value, lowerIsBetter = false) {
      if (!(key in defaults) || !Number.isFinite(value)) {
        return false;
      }

      const old = records[key];

      const isBetter =
        old === null ||
        (lowerIsBetter && old === 0) ||
        (lowerIsBetter ? value < old : value > old);

      if (isBetter) {
        records[key] = value;
        save();
        return true;
      }

      return false;
    },

    increment(key) {
      if (
        !(key in defaults) ||
        typeof records[key] !== "number"
      ) {
        return false;
      }

      records[key] += 1;
      save();
      return true;
    },

    reset() {
      records = { ...defaults };
      save();
    }
  };
})();
