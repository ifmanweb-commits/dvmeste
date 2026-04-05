import { prisma } from '../lib/prisma';

async function main() {
  const challengeId = 'cmniu8h4s0000rgskbz4f671n';
  
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { 
      id: true,
      type: true, 
      title: true,
      test: true,
      work: true,
    },
  });

  if (!challenge) {
    console.log(`Challenge ${challengeId} not found`);
  } else {
    console.log('Challenge info:');
    console.log(JSON.stringify({
      id: challenge.id,
      title: challenge.title,
      type: challenge.type,
      hasTest: !!challenge.test,
      hasWork: !!challenge.work,
    }, null, 2));
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});