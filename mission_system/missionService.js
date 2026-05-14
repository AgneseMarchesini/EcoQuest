const templates = require("./missionTemplates");
const filterCompatiblePOIs = require("./poiFilter");
const generateMission = require("./missionGenerator");
const computeMissionScore = require("./scoringService");
const buildContext = require("./contextService");

async function generateUserMission(pois, lat, lng) {
    const context = await buildContext(lat, lng);

    let candidateMissions = [];

    for (const template of templates) {
        const compatiblePOIs = filterCompatiblePOIs(template, pois, context);
        for (const poi of compatiblePOIs) {
            const mission = generateMission(template, poi);
            mission.score = computeMissionScore(mission, context);
            candidateMissions.push(mission);
        }
    }

    candidateMissions.sort(
        (a, b) => b.score - a.score
    );

    // top 5
    const topMissions = candidateMissions.slice(0, 5);

    // random controllato per evitare di avere sempre le stesse missioni
    const selectedMission = weightedRandom(topMissions);

    return selectedMission;
}

async function generateUserMissions(pois, lat, lng, count = 5) {
    const missions = [];

    for (let i = 0; i < count; i += 1) {
        const mission = await generateUserMission(pois, lat, lng);
        if (mission) {
            missions.push(mission);
        }
    }

    return missions;
}

function weightedRandom(missions) {

    const totalWeight = missions.reduce((sum, mission) => sum + mission.score, 0);

    let random = Math.random() * totalWeight;

    for (const mission of missions) {
        random -= mission.score;
        if (random <= 0) {
            return mission;
        }
    }
    return missions[0];
}

module.exports = generateUserMissions;
