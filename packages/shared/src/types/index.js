// Shared TypeScript types and interfaces
// Even if not using TypeScript, these serve as documentation

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} role - 'ADMIN', 'OPERATOR', 'PLAYER', 'GUEST'
 * @property {string[]} allowedGames
 */

/**
 * @typedef {Object} GameSession
 * @property {string} id
 * @property {string} name
 * @property {string} status - 'waiting', 'active', 'completed'
 * @property {string} gameType
 * @property {string} createdAt
 * @property {User[]} players
 */

/**
 * @typedef {Object} GameState
 * @property {string} phase
 * @property {Player[]} players
 * @property {number} pot
 * @property {number} currentBet
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} status - 'active', 'folded', 'all-in'
 * @property {number} chips
 * @property {Card[]} cards
 */

/**
 * @typedef {Object} Card
 * @property {string} suit
 * @property {string} rank
 * @property {number} value
 */

// Export empty object for module compatibility
export default {};
