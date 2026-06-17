import { useState } from "react";

interface HomePageProps {
  videoSrc: string;
}

const playersOnline = 2847;
const lastPlayed = "Last played 2 hours ago • Version 1.21.4";
const lyxOrbs = 1250;
const totalPlaytime = "342h";
const weeklySessions = 17;

const navLinks = [
  { label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { label: "Mods", icon: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" },
  { label: "Cosmetics", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

const updates = [
  { title: "Season 8 Battle Pass", desc: "New skins, emotes, and rewards available now.", img: "" },
  { title: "Map Update 3.4", desc: "Spawn rework, new parkour routes, and bug fixes.", img: "" },
];

const featuredServer = {
  name: "LIMYRX PvP",
  ip: "play.limyrx.net",
  players: 842,
};

const profiles = ["LIMYRX PvP", "LIMYRX Skyblock", "LIMYRX Kit"];
const profileMods = { "LIMYRX PvP": 12, "LIMYRX Skyblock": 8, "LIMYRX Kit": 15 };

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function GreenDot({ ping }: { ping?: boolean }) {
  return (
    <span className="relative inline-flex">
      <span className={`w-2 h-2 rounded-full bg-[#16be96] ${ping ? "animate-ping" : ""} absolute inline-flex opacity-75`} />
      <span className="w-2 h-2 rounded-full bg-[#16be96] relative inline-flex" />
    </span>
  );
}

export default function HomePage({ videoSrc }: HomePageProps) {
  const [profileIndex, setProfileIndex] = useState(0);
  const profile = profiles[profileIndex];
  const mods = profileMods[profile as keyof typeof profileMods];

  return (
    <div className="min-w-[1280px] w-screen h-screen overflow-hidden relative font-sans text-white select-none">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-3 bg-black/30 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-widest" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            LIMYRX
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-1">Launcher</span>
        </div>

        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors duration-200"
            >
              <NavIcon path={link.icon} />
              <span>{link.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#16be96] to-emerald-700 flex items-center justify-center text-sm font-bold">
            M
          </div>
          <span className="text-sm font-medium">ILMaRkz_</span>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
            <span className="text-sm font-semibold">{lyxOrbs.toLocaleString()}</span>
          </div>
        </div>
      </nav>

      {/* Main layout */}
      <div className="relative z-10 flex h-[calc(100vh-64px)]">
        {/* Left column — 70% */}
        <div className="w-[70%] flex flex-col items-center justify-center px-16">
          <div className="flex flex-col items-center gap-5 max-w-lg w-full">
            {/* Players online badge */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm border border-white/10">
              <GreenDot ping />
              <span className="text-white/90">{playersOnline.toLocaleString()} players online</span>
            </div>

            {/* Logo wordmark */}
            <h1 className="text-7xl font-black tracking-[0.15em] text-white drop-shadow-[0_0_30px_rgba(22,190,150,0.3)]" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
              LIMYRX
            </h1>

            {/* Profile card */}
            <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#16be96]/40 to-emerald-800/40 border border-white/10 flex items-center justify-center text-2xl">
                  <svg className="w-7 h-7 text-[#16be96]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{profile}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold bg-[#16be96]/20 text-[#16be96] px-2 py-0.5 rounded-full border border-[#16be96]/30">
                      1.8.9
                    </span>
                    <span className="text-xs text-white/50">{mods} mods active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setProfileIndex((i) => (i + 1) % profiles.length)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Launch button */}
            <button className="w-full py-4 rounded-full bg-[#16be96] text-white font-black text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(22,190,150,0.4)] hover:shadow-[0_0_40px_rgba(22,190,150,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              Launch Game
            </button>

            {/* Last played */}
            <p className="text-xs text-white/40 tracking-wide">{lastPlayed}</p>
          </div>
        </div>

        {/* Right column — 30% */}
        <div className="w-[30%] bg-black/40 backdrop-blur-md border-l border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Latest Updates */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-4">Latest Updates</h2>
            <div className="flex flex-col gap-3">
              {updates.map((u) => (
                <div key={u.title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex gap-3 transition-all duration-200 hover:bg-white/10">
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center text-white/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{u.title}</h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{u.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Stats */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center transition-all duration-200 hover:bg-white/10">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <p className="text-sm font-bold">{lyxOrbs.toLocaleString()}</p>
                <p className="text-[10px] text-white/40">Orbs</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center transition-all duration-200 hover:bg-white/10">
                <svg className="w-3.5 h-3.5 mx-auto mb-1 text-[#16be96]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-bold">{totalPlaytime}</p>
                <p className="text-[10px] text-white/40">Playtime</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center transition-all duration-200 hover:bg-white/10">
                <svg className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.11 2.11 0 01-1.26-2.188l.061-.514a2.11 2.11 0 011.384-1.755l.718-.287a.827.827 0 001.172-.928l-.116-.347a.827.827 0 01.602-1.025 1.147 1.147 0 011.446.97l.136.822c.033.2.139.38.297.511l.407.339a.833.833 0 001.266-.289l.198-.396a.828.828 0 00-.156-.972 1.242 1.242 0 01-.272-.384l-.36-.823" />
                </svg>
                <p className="text-sm font-bold">{weeklySessions}</p>
                <p className="text-[10px] text-white/40">Sessions</p>
              </div>
            </div>
          </section>

          {/* Featured Server */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-4">Featured Server</h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition-all duration-200 hover:bg-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold">{featuredServer.name}</h3>
                  <p className="text-xs text-white/50 mt-0.5">{featuredServer.ip}</p>
                </div>
                <GreenDot />
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#16be96] animate-pulse" />
                <span className="font-semibold">{featuredServer.players.toLocaleString()}</span>
                <span className="text-white/40">players online</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
