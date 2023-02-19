import express, { response } from 'express';
import bcrypt from 'bcryptjs';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import { isAuthenticated, isAdmin, generateToken} from '../utils.js';

const userRoute = express.Router();

userRoute.get(
  '/',
  isAuthenticated,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

userRoute.post(
  '/',
  isAuthenticated,
  expressAsyncHandler(async (req, res) => {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      // avatar: req.body.avatar,
      birthday: req.body.birthday,
      address: req.body.address,
      phone: req.body.phone,
      role: 'admin',
      isActive: true,
      password: bcrypt.hashSync(req.body.password),
    });
    const user = await newUser.save();
    res.send({
      _id: user._id,
      username: user.username,
      email: user.email,
      birthday: user.birthday,
      address: user.address,
      phone: user.phone,
      role: 'admin',
      isActive: true,
      token: generateToken(user),
    });
  })
);

userRoute.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin'|| user.role === 'masteradmin') {
        res.status(400).send({ message: 'Can Not Delete Admin User' });
        return;
      }
      await user.remove();
      res.send({ message: 'User Deleted' });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRoute.post(
  '/signin',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          birthday: user.birthday,
          phone: user.phone,
          address: user.address,
          isActive: user.isActive,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: 'Invalid email or password' });
  })
);

userRoute.post(
  '/signup',
  expressAsyncHandler(async (req, res) => {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      // avatar: req.body.avatar,
      birthday: req.body.birthday,
      address: req.body.address,
      phone: req.body.phone,
      role: 'customer',
      isActive: true,
      password: bcrypt.hashSync(req.body.password),
    });
    const user = await newUser.save();
    res.send({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: 'customer',
      isActive: true,
      token: generateToken(user),
    });
  })
);

userRoute.put(
  '/profile',
  isAuthenticated,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.address = req.body.address || user.address;
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }

      const updatedUser = await user.save();
      res.send({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        // avatar: updatedUser.avatar,
        birthday: updatedUser.birthday,
        address: updatedUser.address,
        phone: updatedUser.phone,
        token: generateToken(updatedUser),
      });
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  })
);


export default userRoute;
