import { bot } from './bot'

export const handler = bot.handleUpdate.bind(bot)
