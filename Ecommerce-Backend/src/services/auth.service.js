import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prismaWrite } from "../config/prisma.js";
import { normalizeRole, ROLES } from "../middlewares/auth.middleware.js";
import { UserEntity } from "../entities/index.js";

const sanitizeUser = (user) => {
  const entity = new UserEntity({ ...user, role: normalizeRole(user.role) });
  return {
    id: entity.id,
    name: entity.name,
    email: entity.email,
    role: entity.role,
  };
};

const signToken = (user) => {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "dev-secret-key",
    { expiresIn: "7d" },
  );
};

export const registerUser = async ({ name, email, password }) => {
  if (!email || !password) {
    throw Object.assign(new Error("Email and password are required"), {
      statusCode: 400,
    });
  }

  const existingUser = await prismaWrite.$queryRaw`
    SELECT id FROM users WHERE email = ${email} LIMIT 1
  `;

  if (existingUser.length > 0) {
    throw Object.assign(new Error("Email already exists"), {
      statusCode: 409,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const role = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    ? ROLES.ADMIN
    : ROLES.CUSTOMER;
  const roleRows = await prismaWrite.$queryRaw`
    SELECT id FROM roles WHERE code = ${role} LIMIT 1
  `;
  const userRows = await prismaWrite.$queryRaw`
    INSERT INTO users (name, email, password, role, role_id, created_at, updated_at)
    VALUES (${name || null}, ${email}, ${hashedPassword}, ${role}, ${roleRows[0].id}, NOW(), NOW())
    RETURNING id, name, email, role
  `;

  const user = userRows[0];

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw Object.assign(new Error("Email and password are required"), {
      statusCode: 400,
    });
  }

  const userRows = await prismaWrite.$queryRaw`
    SELECT u.id, u.name, u.email, u.password, COALESCE(r.code, u.role) AS role
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE email = ${email}
    LIMIT 1
  `;

  const user = userRows[0];

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
};

export const logoutUser = async () => ({ message: "Logged out" });

export const getCurrentUser = async (user) => ({ user });

export const listUsers = async () => {
  const users = await prismaWrite.$queryRaw`
    SELECT u.id, u.name, u.email, COALESCE(r.code, u.role) AS role, u.created_at
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    ORDER BY created_at DESC
  `;

  return users.map(sanitizeUser);
};

export const updateUserRole = async (userId, role) => {
  const requestedRole = String(role || "").toUpperCase();
  if (![ROLES.CUSTOMER, ROLES.SHOP_OWNER, ROLES.ADMIN].includes(requestedRole)) {
    throw Object.assign(new Error("Invalid role"), { statusCode: 400 });
  }
  const nextRole = requestedRole;

  const rows = await prismaWrite.$queryRaw`
    UPDATE users
    SET role = ${nextRole},
        role_id = (SELECT id FROM roles WHERE code = ${nextRole}),
        updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, name, email, role, created_at
  `;

  if (!rows[0]) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  return sanitizeUser(rows[0]);
};
