const fs = require('fs')

const filename = process.argv[2];
const WIN = 3;
const TIE = 1;
const LOSS = 0;

if (!filename) {
    console.log('Please provide a file path...');
    process.exit(1);
}

// Could add "flat" via babel, but copy pasting works too~~~
Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
        return this.reduce(function (flat, toFlatten) {
            return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
        }, []);
    }
});

const extractTeamAndScoreFromMatch = (match) => {
    return match.split(",").map(teamWithScore => {
        const teamScore = teamWithScore.match(/(\d+)$/)[0]; // accounting for double-digit scores with regex...
        return {
            teamName: teamWithScore.slice(0, -teamScore.length).trim(),
            teamScore: Number(teamScore)
        }
    })
};

const sortPointSumDesc = ([aName, aPoints], [bName, bPoints]) =>  bPoints - aPoints || aName.localeCompare(bName);


const setWinPointsForTeam = team => ({...team, matchPoints: WIN});
const setTiePointsForTeam = team => ({...team, matchPoints: TIE});
const setLossPointsForTeam = team => ({...team, matchPoints: LOSS});

const calculatePointsForMatch = ([teamA, teamB]) => {
    const teamAWon = teamA.teamScore > teamB.teamScore;
    const teamBWon = teamA.teamScore < teamB.teamScore;
    if (teamAWon) return [setWinPointsForTeam(teamA), setLossPointsForTeam(teamB)]
    else if (teamBWon) return [setLossPointsForTeam(teamA), setWinPointsForTeam(teamB)]
    else return [setTiePointsForTeam(teamA), setTiePointsForTeam(teamB)]
};

const calculatePointsPerMatchday = (acc, team) => {
    const teamName = team.teamName;
    const currentMatchday = acc[acc.length - 1];
    const prevMatchday = acc[acc.length - 2];

    if (currentMatchday && currentMatchday[teamName]) {
        acc = [...acc, {[teamName]: currentMatchday[teamName] + team.matchPoints}];
    } else if (prevMatchday && prevMatchday[teamName]) {
        acc[acc.length - 1][teamName] = prevMatchday[teamName] + team.matchPoints;
    } else {
        acc[acc.length - 1][teamName] = team.matchPoints
    }

    return acc;
};

const sortAndSliceTeams = (teams) => Object.entries(teams).sort(sortPointSumDesc).slice(0, 3)

const formatAndLogTeams = (teams, index) => console.log(`${index !== 0 ? "\n" : ""}Matchday ${index + 1}
${teams.map(([teamName, points]) => `${teamName}, ${points} ${points === 1 ? "pt" : "pts"}`).join("\n")}`)

try {
    const fileData = fs.readFileSync(filename, 'utf8');
    const matchList = fileData.trim().split("\n");
    
    matchList
        .map(extractTeamAndScoreFromMatch)
        .map(calculatePointsForMatch)
        .flat()
        .reduce(calculatePointsPerMatchday, [{}])
        .map(sortAndSliceTeams)
        .map(formatAndLogTeams)

} catch(e) {
    console.log('Error:', e.stack);
}
