module.exports = async (fn, retries = 20, intervalMillis = 50) => {
  for (let i = 0; i < retries; i++) {
    const result = await fn();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMillis));
  }
  throw new Error(`${fn} didn't return true after ${retries} retries.`);
};
