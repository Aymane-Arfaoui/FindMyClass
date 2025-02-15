import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/buildinglist';
const coordinatesCache = {};

// Map from user-friendly building names to their corresponding codes
const buildingNameToCodeMap = {
    // SGW Campus
    "Hall Building": "H",
    "EV Building": "EV",
    "John Molson School of Business": "MB",
    "Faubourg Building": "FB",
    "Guy-De Maisonneuve Building": "GM",
    "J.W. McConnell Building": "LB",
    "Visual Arts Building": "VA",
    "Faubourg Ste-Catherine Building": "FG",
    "Grey Nuns Building": "GNA",
    "Guy-Sherbrooke Building": "GS",
    "Samuel Bronfman Building": "SB",
    "Montefiore Building": "MT",
    "Toronto-Dominion Building": "TD",
    "CL Annex": "CL",
    "D Annex": "D",
    "EN Annex": "EN",
    "ER Building": "ER",
    "ES Building": "ES",
    "ET Building": "ET",
    "FA Annex": "FA",
    "MI Annex": "MI",
    "MK Annex": "MK",
    "MM Annex": "MM",
    "MN Annex": "MN",
    "MU Annex": "MU",
    "P Annex": "P",
    "PR Annex": "PR",
    "Q Annex": "Q",
    "R Annex": "R",
    "RR Annex": "RR",
    "S Annex": "S",
    "T Annex": "T",
    "TU Tunnel": "TU",
    "X Annex": "X",
    "Z Annex": "Z",

    // Loyola Campus
    "Administration Building": "AD",
    "Central Building": "CC",
    "Communication Studies and Journalism Building": "CJA",
    "F.C. Smith Building": "FC",
    "Centre for Structural and Functional Genomics": "GE",
    "Applied Science Hub": "HU",
    "Jesuit Residence": "JR",
    "Hingston Hall, wing HA": "HA",
    "Hingston Hall, wing HB": "HB",
    "Hingston Hall, wing HC": "HC",
    "Student Centre": "SC",
    "Solar House": "SH",
    "Richard J. Renaud Science Complex": "SP",
    "Terrebonne Building": "TA",
    "TB Annex": "TB",
    "Loyola Jesuit Hall and Conference Centre": "RF",
    "Vanier Extension": "VE",
    "Vanier Library Building": "VL",
    "PERFORM centre": "PC",
    "PB Building": "PB",
    "Psychology Building": "PY",
    "Physical Services Building": "PS",
    "Recreation and Athletics Complex": "RA",
};

export const fetchBuildingCoordinates = async (location) => {
    if (!location) throw new Error("Invalid location string");

    const locationParts = location.split(' - ');
    if (locationParts.length < 2) {
        throw new Error(`Invalid location format: ${location}`);
    }

    const buildingName = locationParts[1].split('Rm')[0].trim();
    if (!buildingName) {
        throw new Error(`Building name could not be extracted from location: ${location}`);
    }

    const buildingCode = buildingNameToCodeMap[buildingName];
    if (!buildingCode) {
        throw new Error(`Unknown building name: "${buildingName}"`);
    }

    if (coordinatesCache[buildingCode]) {
        return coordinatesCache[buildingCode];
    }

    try {
        const response = await axios.get(API_BASE_URL);
        const buildings = response.data;

        const building = buildings.find(b => b.Building === buildingCode);
        if (!building) {
            throw new Error(`Building code "${buildingCode}" not found.`);
        }

        const coordinates = {
            latitude: parseFloat(building.Latitude),
            longitude: parseFloat(building.Longitude)
        };
        coordinatesCache[buildingCode] = coordinates;
        return coordinates;

    } catch (error) {
        console.error('Failed to fetch building coordinates:', error.message);
        throw new Error('Failed to fetch building coordinates');
    }
};
