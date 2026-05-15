const templates = require("./missionTemplates");
const filterCompatiblePOIs = require("./poiFilter");
const generateMission = require("./missionGenerator");
const computeMissionScore = require("./scoringService");
const buildContext = require("./contextService");
const Mission = require('../models/missione');

async function generateUserMissions(pois, lat, lng, count = 5) {
    const missioniPredefinite = await Mission.find({ predefinita: true });
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

    for (const predefinita of missioniPredefinite) {
        candidateMissions.push({
            ...predefinita.toObject(),
            score: computeMissionScore(predefinita, context)
        });
    }

    candidateMissions.sort((a, b) => b.score - a.score);

    const selected = [];
    const used = new Set();

    while (selected.length < count && used.size < candidateMissions.length) {
        const available = candidateMissions.filter((_, i) => !used.has(i));
        if (available.length === 0) break;

        const mission = weightedRandom(available);
        const idx = candidateMissions.indexOf(mission);
        used.add(idx);
        selected.push(mission);
    }

    return selected;
}

function weightedRandom(missions) {
    const totalWeight = missions.reduce((sum, m) => sum + m.score, 0);
    let random = Math.random() * totalWeight;
    for (const mission of missions) {
        random -= mission.score;
        if (random <= 0) return mission;
    }
    return missions[0];
}

module.exports = generateUserMissions;