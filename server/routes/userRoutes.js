const express = require('express');
const { getProfile, updateProfile, changePassword, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get('/', searchUsers);

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.put('/password', changePassword);

module.exports = router;
