import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await seedGoalTemplates();

  console.log('✅ Seeding complete!');
}

async function seedGoalTemplates() {
  console.log('📊 Seeding goal templates...');

  const existingCount = await prisma.goalTemplate.count({
    where: { isPreset: true },
  });

  if (existingCount > 0) {
    console.log(`⏭️  Skipping: ${existingCount} preset templates already exist`);
    return;
  }

  const templates = [
    {
      targetType: 'DISTANCE',
      targetValue: 10,
      periodType: 'MONTHLY',
      sportType: 'RUN',
      category: 'beginner',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Run 10km this month',
            description: 'Ideal goal for running beginners',
          },
          {
            locale: 'fr',
            title: 'Courir 10km ce mois',
            description: 'Objectif idéal pour débuter la course à pied',
          },
        ],
      },
    },
    {
      targetType: 'FREQUENCY',
      targetValue: 2,
      periodType: 'WEEKLY',
      sportType: null,
      category: 'beginner',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '2 workouts per week',
            description: 'Build a regular sports habit',
          },
          {
            locale: 'fr',
            title: '2 sorties par semaine',
            description: 'Créer une habitude sportive régulière',
          },
        ],
      },
    },
    {
      targetType: 'DURATION',
      targetValue: 5,
      periodType: 'MONTHLY',
      sportType: null,
      category: 'beginner',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '5 hours of sports this month',
            description: 'Accumulate physical activity time',
          },
          {
            locale: 'fr',
            title: '5h de sport ce mois',
            description: "Accumuler du temps d'activité physique",
          },
        ],
      },
    },
    {
      targetType: 'DISTANCE',
      targetValue: 50,
      periodType: 'MONTHLY',
      sportType: 'RUN',
      category: 'intermediate',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Run 50km this month',
            description: 'Classic goal for regular runners',
          },
          {
            locale: 'fr',
            title: 'Courir 50km ce mois',
            description: 'Objectif classique pour coureurs réguliers',
          },
        ],
      },
    },
    {
      targetType: 'DURATION',
      targetValue: 10,
      periodType: 'MONTHLY',
      sportType: 'RIDE',
      category: 'intermediate',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '10 hours of cycling this month',
            description: 'Solid volume for passionate cyclists',
          },
          {
            locale: 'fr',
            title: '10h de vélo ce mois',
            description: 'Volume solide pour cyclistes passionnés',
          },
        ],
      },
    },
    {
      targetType: 'FREQUENCY',
      targetValue: 3,
      periodType: 'WEEKLY',
      sportType: null,
      category: 'intermediate',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '3 workouts per week',
            description: 'Sustained pace for regular athletes',
          },
          {
            locale: 'fr',
            title: '3 sorties par semaine',
            description: 'Rythme soutenu pour sportifs réguliers',
          },
        ],
      },
    },
    {
      targetType: 'ELEVATION',
      targetValue: 2000,
      periodType: 'MONTHLY',
      sportType: null,
      category: 'intermediate',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Climb 2000m elevation this month',
            description: 'Elevation challenge for runners or cyclists',
          },
          {
            locale: 'fr',
            title: 'Gravir 2000m D+ ce mois',
            description: 'Défi dénivelé pour coureurs ou cyclistes',
          },
        ],
      },
    },
    {
      targetType: 'DISTANCE',
      targetValue: 200,
      periodType: 'MONTHLY',
      sportType: 'RUN',
      category: 'advanced',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Run 200km this month',
            description: 'High volume for trained runners',
          },
          {
            locale: 'fr',
            title: 'Courir 200km ce mois',
            description: 'Volume élevé pour coureurs entraînés',
          },
        ],
      },
    },
    {
      targetType: 'ELEVATION',
      targetValue: 5000,
      periodType: 'MONTHLY',
      sportType: null,
      category: 'advanced',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Climb 5000m elevation this month',
            description: 'High volume of positive elevation gain',
          },
          {
            locale: 'fr',
            title: 'Gravir 5000m D+ ce mois',
            description: 'Gros volume de dénivelé positif',
          },
        ],
      },
    },
    {
      targetType: 'FREQUENCY',
      targetValue: 100,
      periodType: 'YEARLY',
      sportType: null,
      category: 'advanced',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '100 workouts this year',
            description: 'Consistency over the entire year',
          },
          {
            locale: 'fr',
            title: '100 sorties cette année',
            description: "Régularité sur l'année complète",
          },
        ],
      },
    },
    {
      targetType: 'DURATION',
      targetValue: 20,
      periodType: 'MONTHLY',
      sportType: null,
      category: 'advanced',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '20 hours of sports this month',
            description: 'Substantial time volume for athletes',
          },
          {
            locale: 'fr',
            title: '20h de sport ce mois',
            description: 'Volume horaire conséquent pour athlètes',
          },
        ],
      },
    },
    {
      targetType: 'ELEVATION',
      targetValue: 8848,
      periodType: 'YEARLY',
      sportType: 'RIDE',
      category: 'challenge',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Everest Challenge (8848m)',
            description: 'Climb the equivalent of Mount Everest in one year',
          },
          {
            locale: 'fr',
            title: 'Everest Challenge (8848m)',
            description: "Gravir l'équivalent de l'Everest en une année",
          },
        ],
      },
    },
    {
      targetType: 'DISTANCE',
      targetValue: 1000,
      periodType: 'YEARLY',
      sportType: 'RUN',
      category: 'challenge',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '1000km this year',
            description: 'Ambitious annual distance challenge',
          },
          {
            locale: 'fr',
            title: '1000km cette année',
            description: 'Challenge distance annuel ambitieux',
          },
        ],
      },
    },
    {
      targetType: 'ELEVATION',
      targetValue: 10000,
      periodType: 'MONTHLY',
      sportType: null,
      category: 'challenge',
      isPreset: true,
      translations: {
        create: [
          {
            locale: 'en',
            title: '10000m elevation this month',
            description: 'Extreme monthly elevation challenge',
          },
          {
            locale: 'fr',
            title: '10000m D+ ce mois',
            description: 'Défi extrême de dénivelé mensuel',
          },
        ],
      },
    },
  ];

  let created = 0;
  for (const template of templates) {
    await prisma.goalTemplate.create({
      data: template,
    });
    created++;
  }

  console.log(`✅ Created ${created} goal templates with translations`);
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
