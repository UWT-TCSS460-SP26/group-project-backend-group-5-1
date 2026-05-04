module.exports = {
  expressjwt: () => (req, res, next) => {
    const header = req.headers['x-test-user'];
    if (header) {
      const claims = JSON.parse(header);
      req.user = { ...claims, sub: Number(claims.sub) };
      next();
    } else {
      res.status(401).json({ error: 'Invalid or missing token' });
    }
  },
};
