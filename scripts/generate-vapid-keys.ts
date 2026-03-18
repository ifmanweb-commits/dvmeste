/**
 * Скрипт для генерации VAPID ключей для Web Push уведомлений
 * 
 * Использование:
 * npx tsx scripts/generate-vapid-keys.ts
 */

import webPush from 'web-push'

const vapidKeys = webPush.generateVAPIDKeys()

console.log('\n🔑 VAPID ключи сгенерированы:\n')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:admin@dvmeste.ru`)
console.log(`\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log('\n📝 Добавьте эти значения в файл .env\n')
