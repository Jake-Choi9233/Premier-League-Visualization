import React, { useState, useEffect } from 'react';

export default function App() {
  // Mock data for teams and players
  const [teams, setTeams] = useState([
    { id: 1, name: 'Manchester United', crest: 'https://placehold.co/50x50?text=MANU ' },
    { id: 2, name: 'Real Madrid', crest: 'https://placehold.co/50x50?text=RM ' }
  ]);

  const [players, setPlayers] = useState([
    // Manchester United Players
    { id: 1, name: 'David De Gea', position: { x: 5, y: 50 }, teamId: 1, stats: { pace: 70, shooting: 60, passing: 75, dribbling: 65, defending: 60 } },
    { id: 2, name: 'Harry Maguire', position: { x: 20, y: 50 }, teamId: 1, stats: { pace: 75, shooting: 65, passing: 70, dribbling: 68, defending: 80 } },
    { id: 3, name: 'Bruno Fernandes', position: { x: 45, y: 50 }, teamId: 1, stats: { pace: 80, shooting: 85, passing: 90, dribbling: 88, defending: 70 } },
    { id: 4, name: 'Marcus Rashford', position: { x: 65, y: 45 }, teamId: 1, stats: { pace: 90, shooting: 85, passing: 80, dribbling: 88, defending: 65 } },

    // Real Madrid Players
    { id: 5, name: 'Thibaut Courtois', position: { x: 5, y: 50 }, teamId: 2, stats: { pace: 65, shooting: 60, passing: 70, dribbling: 65, defending: 60 } },
    { id: 6, name: 'Sergio Ramos', position: { x: 20, y: 50 }, teamId: 2, stats: { pace: 70, shooting: 65, passing: 75, dribbling: 70, defending: 85 } },
    { id: 7, name: 'Luka Modric', position: { x: 45, y: 50 }, teamId: 2, stats: { pace: 85, shooting: 80, passing: 90, dribbling: 88, defending: 75 } },
    { id: 8, name: 'Karim Benzema', position: { x: 65, y: 45 }, teamId: 2, stats: { pace: 85, shooting: 90, passing: 85, dribbling: 88, defending: 65 } }
  ]);

  const [selectedTeamId, setSelectedTeamId] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [view, setView] = useState('pitch'); // pitch, player, team

  // Filter players based on selected team
  const teamPlayers = players.filter(player => player.teamId === selectedTeamId);

  // Handle team selection change
  const handleTeamChange = (e) => {
    setSelectedTeamId(parseInt(e.target.value));
    setView('pitch');
  };

  // Handle player click to show radar chart
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setView('player');
  };

  // Navigate to team info
  const navigateToTeamInfo = () => {
    setView('team');
  };

  // Navigate back to pitch
  const navigateBack = () => {
    setView('pitch');
    setSelectedPlayer(null);
  };

  // Radar chart component
  const RadarChart = ({ stats }) => {
    const maxValue = 100;
    const numStats = Object.keys(stats).length;
    const radius = 150;
    const centerX = 200;
    const centerY = 200;
    const angleStep = (2 * Math.PI) / numStats;

    // Generate polygon points
    const polygonPoints = Object.values(stats).map((value, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const normalizedValue = (value / maxValue) * radius;
      const x = centerX + normalizedValue * Math.cos(angle);
      const y = centerY + normalizedValue * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    // Generate lines and labels
    const statElements = Object.entries(stats).map(([key, value], i) => {
      const angle = angleStep * i - Math.PI / 2;
      const normalizedValue = (value / maxValue) * radius;
      const x = centerX + normalizedValue * Math.cos(angle);
      const y = centerY + normalizedValue * Math.sin(angle);
      const labelX = centerX + (radius + 20) * Math.cos(angle);
      const labelY = centerY + (radius + 20) * Math.sin(angle);

      return (
        <g key={key}>
          <line
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="rgba(76, 175, 80, 0.8)"
            strokeWidth="2"
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
          >
            {key}: {value}
          </text>
        </g>
      );
    });

    return (
      <div className="flex flex-col items-center">
        <svg width="400" height="400" className="bg-gray-800 rounded-lg shadow-xl p-4">
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />
          <circle cx={centerX} cy={centerY} r={radius/2} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" />
          <polygon points={polygonPoints} fill="rgba(76, 175, 80, 0.5)" stroke="rgba(76, 175, 80, 0.8)" strokeWidth="2" />
          {statElements}
        </svg>
        <button
          onClick={navigateBack}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300 shadow-md"
        >
          Back to Pitch
        </button>
      </div>
    );
  };

  // Team info component
  const TeamInfo = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <img src={team.crest} alt={`${team.name} crest`} className="w-16 h-16 mr-4" />
          <h2 className="text-2xl font-bold text-white">{team.name}</h2>
        </div>
        <div className="text-gray-300">
          <p className="mb-2">Players in squad: {teamPlayers.length}</p>
          <p className="mb-2">Stadium: Old Trafford</p>
          <p className="mb-2">Manager: Erik ten Hag</p>
          <p className="mb-2">League: Premier League</p>
        </div>
        <button
          onClick={navigateBack}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300 shadow-md"
        >
          Back to Pitch
        </button>
      </div>
    );
  };

  // Football pitch with player avatars
  const FootballPitch = () => {
    return (
      <div className="relative w-full max-w-4xl mx-auto aspect-[2/1]">
        {/* Football field background */}
        <div className="absolute inset-0 bg-green-600 rounded-lg overflow-hidden shadow-lg">
          {/* Field markings */}
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <div className="w-full h-full border-4 border-white border-opacity-70"></div>
            <div className="absolute w-1/2 h-full border-r-4 border-white border-opacity-70"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-4 border-white rounded-full"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-20 h-32 border-4 border-white border-r-0 rounded-l-full"></div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-20 h-32 border-4 border-white border-l-0 rounded-r-full"></div>
          </div>
        </div>

        {/* Player avatars */}
        {teamPlayers.map(player => (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-110"
            style={{
              left: `${player.position.x}%`,
              top: `${player.position.y}%`
            }}
            onClick={() => handlePlayerClick(player)}
          >
            <div className="relative group">
              <img
                src={`https://placehold.co/50x50?text= ${player.name.split(' ')[0][0]}${player.name.split(' ')[1][0]}`}
                alt={player.name}
                className="w-12 h-12 rounded-full border-4 border-white shadow-md object-cover"
              />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {player.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
          Football Dashboard
        </h1>
      </header>

      <div className="max-w-4xl mx-auto">
        {view === 'pitch' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <select
                value={selectedTeamId}
                onChange={handleTeamChange}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <button
                onClick={navigateToTeamInfo}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition duration-300 border border-gray-700"
              >
                Team Info
              </button>
            </div>

            <FootballPitch />
          </div>
        )}

        {view === 'player' && selectedPlayer && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6">{selectedPlayer.name} - Player Stats</h2>
            <RadarChart stats={selectedPlayer.stats} />
          </div>
        )}

        {view === 'team' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Team Information</h2>
            <TeamInfo />
          </div>
        )}
      </div>
    </div>
  );
}