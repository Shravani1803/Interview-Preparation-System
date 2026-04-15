const jwt = require('jsonwebtoken');

const ensureAuthenticated = (req, res, next) => {
    const auth = req.header('authorization');
    if (!auth) {
        return res.status(403)
            .json({ message: 'Unauthorized, JWT token is required' });
    }

    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth.trim();
    if (!token) {
        return res.status(403)
            .json({ message: 'Unauthorized, JWT token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401)
            .json({ message: 'Unauthorized, JWT token is wrong or expired' });
    }
};

module.exports = ensureAuthenticated;