# Kaboom Game Admin Dashboard

A modern, real-time admin dashboard for the Kaboom Solana game built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Secure Authentication** - Admin login with JWT tokens
- 📊 **Real-time Updates** - Live data updates via Socket.IO
- 📈 **Interactive Charts** - Leaderboard visualization with Recharts
- 🔍 **Advanced Filtering** - Search, date ranges, score filters
- 📋 **Player Management** - View, sort, and manage player data
- 📊 **Dashboard Stats** - Key metrics and analytics
- 📤 **Data Export** - CSV export functionality
- 🎨 **Modern UI** - Beautiful, responsive design with Framer Motion
- 🔄 **Real-time Sync** - WebSocket connection for live updates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Charts**: Recharts
- **Real-time**: Socket.IO Client
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running Kaboom game server (backend)

### Installation

1. **Install dependencies:**
   ```bash
   cd admin-dashboard
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=kaboom2024
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the dashboard:**
   Open [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

- **Username**: `admin`
- **Password**: `kaboom2024`

⚠️ **Important**: Change these credentials in production!

## API Endpoints

The dashboard communicates with the main game server via these endpoints:

### Authentication
- `POST /api/admin/login` - Admin authentication

### Player Data
- `GET /api/players` - Get paginated players with filters
- `GET /api/players/:wallet` - Get specific player
- `POST /api/submit-score` - Submit game score

### Admin Dashboard
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/leaderboard` - Player leaderboard
- `GET /api/admin/events` - Game events
- `GET /api/admin/export.csv` - Export player data

### Health Checks
- `GET /api/health` - Server health status
- `GET /api/healthz` - Koyeb health check

## Real-time Features

The dashboard uses Socket.IO for real-time updates:

- **Live Score Updates** - New scores appear instantly
- **Player Activity** - Real-time player status changes
- **Dashboard Refresh** - Automatic stats updates
- **Connection Status** - Visual connection indicators

## Deployment

### Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_API_BASE` - Your backend API URL
   - `ADMIN_USERNAME` - Admin username
   - `ADMIN_PASSWORD` - Admin password

### Koyeb Deployment

1. **Create `koyeb.yaml`:**
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

## Project Structure

```
admin-dashboard/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── StatsCard.tsx      # Statistics cards
│   ├── PlayersTable.tsx   # Player data table
│   ├── LeaderboardChart.tsx # Charts
│   ├── FilterPanel.tsx    # Search/filter controls
│   └── LoginModal.tsx     # Authentication modal
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
├── types/                # TypeScript definitions
│   └── index.ts          # Type definitions
└── public/               # Static assets
```

## Customization

### Adding New Stats

1. **Update types** in `types/index.ts`:
   ```typescript
   interface DashboardStats {
     // ... existing stats
     newStat: number;
   }
   ```

2. **Add API endpoint** in `lib/api.ts`:
   ```typescript
   async getNewStat(): Promise<number> {
     const response = await this.request<number>('/api/admin/new-stat');
     return response.data || 0;
   }
   ```

3. **Add component** in `components/StatsCard.tsx`:
   ```typescript
   <StatsCard
     title="New Stat"
     value={formatNumber(stats.newStat)}
     icon={NewIcon}
     color="blue"
   />
   ```

### Styling

The dashboard uses Tailwind CSS with custom CSS variables:

- **Colors**: Defined in `app/globals.css`
- **Components**: Styled with utility classes
- **Animations**: Framer Motion for smooth transitions

## Security Considerations

1. **Change default credentials** in production
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** in production
4. **Implement rate limiting** on the backend
5. **Add proper JWT validation** for production use

## Troubleshooting

### Common Issues

1. **Connection failed**: Check `NEXT_PUBLIC_API_BASE` URL
2. **Real-time not working**: Verify Socket.IO server is running
3. **Build errors**: Ensure all dependencies are installed
4. **Authentication fails**: Check admin credentials

### Debug Mode

Enable debug logging:
```bash
DEBUG=socket.io:* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
