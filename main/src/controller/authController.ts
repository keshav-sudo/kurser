import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export const githubLogin = (req: Request, res: Response) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&scope=repo,user:email`;
  res.redirect(githubAuthUrl);
};

export const githubCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code
      },
      {
        headers: { Accept: 'application/json' }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const githubUser = userResponse.data;
    
    // Save or update user
    let user = await User.findOne({ githubId: githubUser.id.toString() });
    
    if (user) {
      user.accessToken = accessToken;
      user.username = githubUser.login;
      user.email = githubUser.email;
      user.avatarUrl = githubUser.avatar_url;
      await user.save();
    } else {
      user = await User.create({
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        email: githubUser.email,
        accessToken,
        avatarUrl: githubUser.avatar_url,
        repos: []
      });
    }
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, config.jwt.secret, { expiresIn: '30d' });
    
    // Redirect to frontend with token
    res.redirect(`${config.frontend.url}/?token=${token}`);
  } catch (error: any) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      repos: user.repos
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
