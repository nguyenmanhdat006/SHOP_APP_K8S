import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  listUsers,
  updateUserRole,
} from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  const result = await logoutUser();
  res.json(result);
};

export const me = async (req, res) => {
  const result = await getCurrentUser(req.user);
  res.json(result);
};

export const users = async (req, res, next) => {
  try {
    res.json(await listUsers());
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req, res, next) => {
  try {
    res.json(await updateUserRole(Number(req.params.id), req.body.role));
  } catch (error) {
    next(error);
  }
};
