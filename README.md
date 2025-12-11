# VoiceLink - Next-Gen Voice Calling

A futuristic voice calling application built with Next.js and LiveKit, featuring web and phone call capabilities with a sleek, modern interface.

## Features

- 🎤 **HD Voice Calling** - Crystal clear audio with ultra-low latency
- 📞 **Web Calls** - Direct peer-to-peer voice calls in the browser
- 📱 **Phone Calls** - Call phone numbers and connect via LiveKit
- ✨ **Futuristic UI** - Beautiful light-theme interface with glassmorphic design
- 🔐 **Secure** - JWT token-based authentication with LiveKit
- 📊 **Real-time Status** - Live connection status and call duration

## Getting Started

### Prerequisites

- Node.js 18+ 
- LiveKit server or cloud account

### Setup

1. **Install dependencies** (auto-installed by v0):
   \`\`\`bash
   npm install livekit-client livekit-server-sdk nanoid
   \`\`\`

2. **Configure LiveKit** - Add environment variables to your project:

   Go to the **Vars** section in the v0 sidebar and add:
   \`\`\`
   LIVEKIT_URL=ws://your-livekit-url:7880
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   \`\`\`

   **Don't have LiveKit?**
   - Get started for free: https://livekit.io/getting-started
   - Local development: Use Docker to run LiveKit locally

   **Example for local development:**
   \`\`\`
   LIVEKIT_URL=ws://localhost:7880
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   \`\`\`

3. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open in browser**:
   \`\`\`
   http://localhost:3000
   \`\`\`

## Usage

### Starting a Web Call

1. Click "Web Call" on the landing page
2. The app generates a unique room and connects to LiveKit
3. Share the room name with someone else to have them join
4. Enjoy crystal-clear audio!

### Starting a Phone Call

1. Click "Phone Call"
2. Enter a phone number
3. The call will be routed through LiveKit

## Architecture

### Frontend Components

- **Call Setup** (`call-setup.tsx`) - Landing page with call type selection
- **Call Interface** (`call-interface.tsx`) - Active call UI with controls
- **LiveKit Status** (`livekit-status.tsx`) - Configuration status indicator

### Backend API

- `POST /api/calls` - Create a new call session
  - Generates unique room name
  - Creates LiveKit access token
  - Returns connection details
  
- `GET /api/calls/[roomName]` - Get call session info
  - Returns room status and participant count
  
- `DELETE /api/calls/[roomName]` - End a call
  - Cleans up LiveKit room

- `GET /api/livekit-status` - Check LiveKit configuration

### Hooks

- `useCall()` (`use-livekit-call.ts`) - Manages LiveKit room connection and audio controls

## LiveKit Integration

The app uses:
- **@vercel/postgres** - Not used (ready for data persistence)
- **livekit-client** - WebRTC client for voice/video
- **livekit-server-sdk** - Server-side room management and token generation

## Troubleshooting

### "LiveKit not configured" error

Add the required environment variables:
1. Go to Vars section in v0 sidebar
2. Add `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
3. Restart the development server

### Connection fails

- Check that LiveKit server is running and accessible
- Verify environment variables are correct
- Check browser console for detailed error messages
- Ensure firewall/network allows WebSocket connections

### Audio not working

- Check browser microphone permissions
- Verify microphone is not in use by another application
- Try a different browser
- Check that audio input device is properly connected

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import repository to Vercel
3. Add environment variables in project settings:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
4. Deploy

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── calls/
│   │   │   ├── route.ts           # Create/list calls
│   │   │   └── [roomName]/
│   │   │       └── route.ts       # Get/delete call
│   │   └── livekit-status/
│   │       └── route.ts           # Configuration status
│   ├── page.tsx                   # Main entry point
│   ├── layout.tsx                 # App layout
│   └── globals.css                # Global styles
├── components/
│   ├── call-interface.tsx         # Active call UI
│   ├── call-setup.tsx             # Landing page
│   └── livekit-status.tsx         # Status indicator
├── hooks/
│   └── use-livekit-call.ts        # LiveKit connection hook
├── lib/
│   ├── livekit-config.ts          # Configuration utilities
│   └── livekit-client.ts          # Client utilities
└── env.example                     # Environment template
\`\`\`

## License

MIT

## Support

For issues with:
- **VoiceLink app** - Create an issue in this repository
- **LiveKit** - Visit https://docs.livekit.io

---

Built with ❤️ using [Next.js](https://nextjs.org) and [LiveKit](https://livekit.io)
