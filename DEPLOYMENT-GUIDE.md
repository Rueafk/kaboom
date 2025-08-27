# Kaboom Game - Complete Deployment Guide

This guide covers deploying the entire Kaboom Solana game system, including the main game server and the new real-time admin dashboard.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Game Client   │    │  Admin Dashboard │    │  Solana Wallet  │
│   (Frontend)    │    │   (Next.js)      │    │   (Phantom)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   Game Server    │
                    │   (Express.js)   │
                    │   + Socket.IO    │
                    └──────────────────┘
                                 │
                    ┌──────────────────┐
                    │   SQLite DB      │
                    │   + Blockchain   │
                    └──────────────────┘
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Solana CLI (optional, for blockchain features)
- Vercel account (for admin dashboard)
- Koyeb account (for game server)

## 1. Backend Server Setup

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env-template.txt .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=8000
   NODE_ENV=development
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=kaboom2024
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Verify it's running:**
   - Game: http://localhost:8000
   - Admin Dashboard: http://localhost:8000/admin
   - Health Check: http://localhost:8000/api/health

### Production Deployment (Koyeb)

1. **Create `koyeb.yaml`:**
   ```yaml
   name: kaboom-game-server
   service:
     type: web
     env:
       - name: PORT
         value: 8000
       - name: NODE_ENV
         value: production
       - name: ADMIN_USERNAME
         value: admin
       - name: ADMIN_PASSWORD
         value: your-secure-password
     ports:
       - port: 8000
         protocol: http
   ```

2. **Deploy:**
   ```bash
   koyeb app init kaboom-game-server --docker
   ```

3. **Get your backend URL:**
   ```
   https://your-app-name.koyeb.app
   ```

## 2. Admin Dashboard Setup

### Local Development

1. **Navigate to admin dashboard:**
   ```bash
   cd admin-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=kaboom2024
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access dashboard:**
   Open http://localhost:3000

### Production Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd admin-dashboard
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_API_BASE`: Your Koyeb backend URL
   - `ADMIN_USERNAME`: Admin username
   - `ADMIN_PASSWORD`: Admin password

### Alternative: Koyeb Deployment

1. **Create `koyeb-admin.yaml`:**
   ```yaml
   name: kaboom-admin-dashboard
   service:
     type: web
     env:
       - name: NEXT_PUBLIC_API_BASE
         value: https://your-backend-url.koyeb.app
       - name: ADMIN_USERNAME
         value: admin
       - name: ADMIN_PASSWORD
         value: your-secure-password
   ```

2. **Deploy:**
   ```bash
   koyeb app init kaboom-admin-dashboard --docker
   ```

## 3. Database Setup

### SQLite (Default)

The system uses SQLite by default. The database files are:
- `kaboom_game.db` (development)
- `kaboom_game_production.db` (production)

### PostgreSQL (Optional)

For production, you can switch to PostgreSQL:

1. **Install PostgreSQL dependencies:**
   ```bash
   npm install pg
   ```

2. **Update database configuration in `server.js`**

3. **Set environment variables:**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

## 4. Blockchain Integration

### Solana Setup

1. **Install Solana CLI:**
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

2. **Set up wallet:**
   ```bash
   solana-keygen new
   ```

3. **Configure network:**
   ```bash
   solana config set --url devnet
   ```

4. **Update blockchain configuration in `web3/` directory**

## 5. Security Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=8000
NODE_ENV=production
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key
CORS_ORIGINS=https://your-domain.com
```

**Admin Dashboard (.env.local):**
```env
NEXT_PUBLIC_API_BASE=https://your-backend-url.com
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-password
```

### Security Best Practices

1. **Change default credentials**
2. **Use strong passwords**
3. **Enable HTTPS in production**
4. **Set up rate limiting**
5. **Configure CORS properly**
6. **Use environment variables for secrets**

## 6. Monitoring & Logging

### Health Checks

- **Backend**: `GET /api/health`
- **Koyeb**: `GET /api/healthz`
- **Admin Dashboard**: Built-in status indicators

### Logging

The system uses structured logging with Pino:
- Development: Pretty-printed logs
- Production: JSON logs

### Metrics

Key metrics to monitor:
- Player count
- Game sessions
- Score submissions
- API response times
- Error rates

## 7. Scaling Considerations

### Horizontal Scaling

1. **Database**: Use PostgreSQL for multiple instances
2. **Session Storage**: Use Redis for session management
3. **Load Balancing**: Use Koyeb's built-in load balancer
4. **CDN**: Use Vercel's edge network for admin dashboard

### Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried fields
2. **Caching**: Implement Redis caching for player data
3. **Connection Pooling**: Use connection pools for database
4. **Asset Optimization**: Optimize game assets and sprites

## 8. Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in server.js
   - Verify allowed origins

2. **Database Connection**
   - Check database file permissions
   - Verify database path

3. **Real-time Updates Not Working**
   - Check Socket.IO configuration
   - Verify WebSocket connections

4. **Admin Dashboard Not Loading**
   - Check API base URL
   - Verify environment variables

### Debug Commands

```bash
# Check server status
curl http://localhost:8000/api/health

# Check admin dashboard
curl http://localhost:3000

# View server logs
tail -f server.log

# Check database
sqlite3 kaboom_game.db ".tables"
```

## 9. Backup & Recovery

### Database Backup

```bash
# Backup SQLite database
cp kaboom_game_production.db backup_$(date +%Y%m%d_%H%M%S).db

# Restore from backup
cp backup_20241201_120000.db kaboom_game_production.db
```

### Configuration Backup

```bash
# Backup environment files
cp .env .env.backup
cp admin-dashboard/.env.local admin-dashboard/.env.local.backup
```

## 10. Updates & Maintenance

### Updating the System

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Update dependencies:**
   ```bash
   npm install
   cd admin-dashboard && npm install
   ```

3. **Restart services:**
   ```bash
   # Restart backend
   npm restart
   
   # Restart admin dashboard
   cd admin-dashboard && npm restart
   ```

### Maintenance Schedule

- **Daily**: Check health endpoints
- **Weekly**: Review logs and metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

## 11. Support & Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Solana Documentation](https://docs.solana.com/)

### Community

- GitHub Issues: Report bugs and feature requests
- Discord: Join the community for support
- Stack Overflow: Search for solutions

### Monitoring Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Performance**: New Relic, DataDog

## Quick Start Checklist

- [ ] Backend server deployed and running
- [ ] Admin dashboard deployed and accessible
- [ ] Environment variables configured
- [ ] Database initialized with sample data
- [ ] Real-time updates working
- [ ] Admin authentication working
- [ ] Health checks passing
- [ ] SSL certificates configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented

## Emergency Contacts

- **Critical Issues**: Create GitHub issue with "URGENT" label
- **Security Issues**: Email security@kaboom-game.com
- **Performance Issues**: Check monitoring dashboard first

---

**Note**: This deployment guide assumes you have basic knowledge of Node.js, Git, and cloud deployment platforms. For additional support, refer to the platform-specific documentation or contact the development team.
