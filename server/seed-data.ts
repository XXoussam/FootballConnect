import { db } from './db';
import { 
  users, posts, comments, likes, connections, 
  opportunities, events, messages 
} from '../shared/schema';
import { hash } from './utils';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Starting database seeding...');

  try {
    // First, clear any existing data
    console.log('Clearing existing data...');
    await db.delete(messages);
    await db.delete(likes);
    await db.delete(comments);
    await db.delete(posts);
    await db.delete(connections);
    await db.delete(opportunities);
    await db.delete(events);
    await db.delete(users);
    
    console.log('Creating users...');
    
    // Create users
    const [davidBeckham] = await db.insert(users).values({
      username: 'davidbeckham',
      password: await hash('password123'),
      fullName: 'David Beckham',
      position: 'Midfielder',
      club: 'Inter Miami CF (Owner)',
      location: 'Miami, USA',
      bio: 'Former professional footballer and current President & Co-Owner of Inter Miami CF.',
      avatarUrl: 'https://i.imgur.com/PN8XzLO.jpg',
      verified: true,
      isPro: true
    }).returning();
    
    const [cristianoRonaldo] = await db.insert(users).values({
      username: 'cristiano',
      password: await hash('password123'),
      fullName: 'Cristiano Ronaldo',
      position: 'Forward',
      club: 'Al Nassr FC',
      location: 'Riyadh, Saudi Arabia',
      bio: 'Professional footballer. Five-time Ballon d\'Or winner.',
      avatarUrl: 'https://i.imgur.com/HRVvKK2.jpg',
      verified: true,
      isPro: true
    }).returning();
    
    const [lionelMessi] = await db.insert(users).values({
      username: 'leomessi',
      password: await hash('password123'),
      fullName: 'Lionel Messi',
      position: 'Forward',
      club: 'Inter Miami CF',
      location: 'Miami, USA',
      bio: 'Professional footballer. World Cup champion.',
      avatarUrl: 'https://i.imgur.com/PCoZEGH.jpg',
      verified: true,
      isPro: true
    }).returning();
    
    const [pepGuardiola] = await db.insert(users).values({
      username: 'pepguardiola',
      password: await hash('password123'),
      fullName: 'Pep Guardiola',
      position: 'Manager',
      club: 'Manchester City',
      location: 'Manchester, UK',
      bio: 'Football manager and former player. Multiple Premier League and Champions League winner.',
      avatarUrl: 'https://i.imgur.com/U9KlKZo.jpg',
      verified: true,
      isPro: true
    }).returning();
    
    const [erlingHaaland] = await db.insert(users).values({
      username: 'erlinghaaland',
      password: await hash('password123'),
      fullName: 'Erling Haaland',
      position: 'Forward',
      club: 'Manchester City',
      location: 'Manchester, UK',
      bio: 'Professional footballer. Top goalscorer.',
      avatarUrl: 'https://i.imgur.com/bOMxzXs.jpg',
      verified: true,
      isPro: true
    }).returning();
    
    const [kylianMbappe] = await db.insert(users).values({
      username: 'kylianmbappe',
      password: await hash('password123'),
      fullName: 'Kylian Mbappé',
      position: 'Forward',
      club: 'Real Madrid',
      location: 'Madrid, Spain',
      bio: 'Professional footballer. World Cup winner with France.',
      avatarUrl: 'https://i.imgur.com/OI5UvnM.jpg',
      verified: true,
      isPro: true
    }).returning();

    const [realMadrid] = await db.insert(users).values({
      username: 'realmadrid',
      password: await hash('password123'),
      fullName: 'Real Madrid CF',
      position: 'Club',
      club: 'Real Madrid CF',
      location: 'Madrid, Spain',
      bio: 'Official account of Real Madrid Club de Fútbol. 14-time Champions League winners.',
      avatarUrl: 'https://i.imgur.com/wMnNVLF.png',
      verified: true,
      isPro: true
    }).returning();
    
    const [barcelonaFC] = await db.insert(users).values({
      username: 'fcbarcelona',
      password: await hash('password123'),
      fullName: 'FC Barcelona',
      position: 'Club',
      club: 'FC Barcelona',
      location: 'Barcelona, Spain',
      bio: 'Official account of FC Barcelona. Més que un club.',
      avatarUrl: 'https://i.imgur.com/0BzKfYW.png',
      verified: true,
      isPro: true
    }).returning();
    
    const [manchesterUnited] = await db.insert(users).values({
      username: 'manutd',
      password: await hash('password123'),
      fullName: 'Manchester United',
      position: 'Club',
      club: 'Manchester United',
      location: 'Manchester, UK',
      bio: 'Official account of Manchester United. #MUFC',
      avatarUrl: 'https://i.imgur.com/bBG48H8.png',
      verified: true,
      isPro: true
    }).returning();
    
    const [johnDoe] = await db.insert(users).values({
      username: 'johndoe',
      password: await hash('password123'),
      fullName: 'John Doe',
      position: 'Forward',
      club: 'Local FC',
      location: 'London, UK',
      bio: 'Aspiring footballer looking for opportunities.',
      avatarUrl: 'https://i.imgur.com/6YWUd7g.jpg',
      verified: false,
      isPro: false
    }).returning();
    
    console.log('Creating posts...');
    
    // Posts
    const [post1] = await db.insert(posts).values({
      authorId: davidBeckham.id,
      content: 'Excited to announce our new signing at Inter Miami CF! #MLS #Football',
      type: 'text',
      likes: 0
    }).returning();
    
    const [post2] = await db.insert(posts).values({
      authorId: cristianoRonaldo.id,
      content: 'Just finished an intense training session. Always pushing to be better! 💪',
      type: 'text',
      likes: 0
    }).returning();
    
    const [post3] = await db.insert(posts).values({
      authorId: lionelMessi.id,
      content: 'Happy to score my 500th career goal today. Thanks to all the fans for your support! ⚽',
      type: 'achievement',
      achievementTitle: '500 Career Goals',
      achievementSubtitle: 'Career Milestone',
      likes: 0
    }).returning();
    
    const [post4] = await db.insert(posts).values({
      authorId: pepGuardiola.id,
      content: 'Proud of the team\'s performance today. Great effort from everyone.',
      type: 'text',
      likes: 0
    }).returning();
    
    const [post5] = await db.insert(posts).values({
      authorId: erlingHaaland.id,
      content: 'My stats from this season so far!',
      type: 'stats',
      statsData: JSON.stringify({
        goals: 25,
        assists: 5,
        matchesPlayed: 20
      }),
      likes: 0
    }).returning();
    
    const [post6] = await db.insert(posts).values({
      authorId: kylianMbappe.id,
      content: 'Excited for the new challenge at Real Madrid! Looking forward to making history together. #HalaMadrid',
      type: 'text',
      likes: 0
    }).returning();
    
    const [post7] = await db.insert(posts).values({
      authorId: realMadrid.id,
      content: 'Congratulations to our team for winning the Champions League! 🏆 #ChampionsLeague #RealMadrid',
      type: 'achievement',
      achievementTitle: 'Champions League Winners',
      achievementSubtitle: 'Club Achievement',
      likes: 0
    }).returning();
    
    console.log('Creating comments...');
    
    // Comments
    await db.insert(comments).values({
      postId: post1.id,
      authorId: cristianoRonaldo.id,
      content: 'Great news! Looking forward to seeing the new talent.'
    });
    
    await db.insert(comments).values({
      postId: post2.id,
      authorId: lionelMessi.id,
      content: 'Keep up the hard work! 💯'
    });
    
    await db.insert(comments).values({
      postId: post3.id,
      authorId: davidBeckham.id,
      content: 'Congratulations Leo! Amazing achievement.'
    });
    
    await db.insert(comments).values({
      postId: post3.id,
      authorId: cristianoRonaldo.id,
      content: 'Congrats! Welcome to the 500 club.'
    });
    
    await db.insert(comments).values({
      postId: post4.id,
      authorId: erlingHaaland.id,
      content: 'Thanks coach for your support!'
    });
    
    await db.insert(comments).values({
      postId: post7.id,
      authorId: kylianMbappe.id,
      content: 'Can\'t wait to be part of this winning team!'
    });
    
    console.log('Creating likes...');
    
    // Likes
    await db.insert(likes).values({
      postId: post1.id,
      userId: cristianoRonaldo.id
    });
    
    await db.insert(likes).values({
      postId: post1.id,
      userId: lionelMessi.id
    });
    
    await db.insert(likes).values({
      postId: post2.id,
      userId: davidBeckham.id
    });
    
    await db.insert(likes).values({
      postId: post3.id,
      userId: cristianoRonaldo.id
    });
    
    await db.insert(likes).values({
      postId: post3.id,
      userId: davidBeckham.id
    });
    
    await db.insert(likes).values({
      postId: post3.id,
      userId: pepGuardiola.id
    });
    
    await db.insert(likes).values({
      postId: post4.id,
      userId: erlingHaaland.id
    });
    
    await db.insert(likes).values({
      postId: post5.id,
      userId: pepGuardiola.id
    });
    
    await db.insert(likes).values({
      postId: post6.id,
      userId: realMadrid.id
    });
    
    await db.insert(likes).values({
      postId: post7.id,
      userId: kylianMbappe.id
    });
    
    // Update post like counts
    await db.execute(sql`
      UPDATE posts 
      SET likes = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id)
    `);
    
    console.log('Creating connections...');
    
    // Connections
    await db.insert(connections).values({
      requesterId: davidBeckham.id,
      receiverId: cristianoRonaldo.id,
      status: 'accepted'
    });
    
    await db.insert(connections).values({
      requesterId: davidBeckham.id,
      receiverId: lionelMessi.id,
      status: 'accepted'
    });
    
    await db.insert(connections).values({
      requesterId: cristianoRonaldo.id,
      receiverId: lionelMessi.id,
      status: 'accepted'
    });
    
    await db.insert(connections).values({
      requesterId: pepGuardiola.id,
      receiverId: erlingHaaland.id,
      status: 'accepted'
    });
    
    await db.insert(connections).values({
      requesterId: realMadrid.id,
      receiverId: kylianMbappe.id,
      status: 'accepted'
    });
    
    await db.insert(connections).values({
      requesterId: barcelonaFC.id,
      receiverId: lionelMessi.id,
      status: 'accepted'
    });
    
    await db.insert(connections).values({
      requesterId: manchesterUnited.id,
      receiverId: davidBeckham.id,
      status: 'accepted'
    });
    
    await db.insert(connections).values({
      requesterId: johnDoe.id,
      receiverId: davidBeckham.id,
      status: 'pending'
    });
    
    await db.insert(connections).values({
      requesterId: johnDoe.id,
      receiverId: cristianoRonaldo.id,
      status: 'pending'
    });
    
    console.log('Creating opportunities...');
    
    // Opportunities
    await db.insert(opportunities).values({
      title: 'First Team Midfielder',
      club: 'Manchester City',
      location: 'Manchester, UK',
      category: 'football',
      position: 'Midfielder',
      description: 'Seeking an experienced midfielder with exceptional passing ability and vision to join our first team. Premier League and Champions League experience preferred.',
      salary: '£200k-£300k per week',
      type: 'Professional'
    });
    
    await db.insert(opportunities).values({
      title: 'Youth Academy Trials',
      club: 'FC Barcelona',
      location: 'Barcelona, Spain',
      category: 'academy',
      position: 'Various',
      description: 'La Masia is holding trials for talented young players aged 12-16. This is your chance to join one of the world\'s most prestigious football academies.',
      salary: null,
      type: 'Youth Development'
    });
    
    await db.insert(opportunities).values({
      title: 'Goalkeeper Coach',
      club: 'Liverpool FC',
      location: 'Liverpool, UK',
      category: 'coaching',
      position: 'Coach',
      description: 'Looking for an experienced goalkeeper coach to work with our senior team. UEFA Pro License required.',
      salary: '£75k-£100k per year',
      type: 'Coaching Staff'
    });
    
    await db.insert(opportunities).values({
      title: 'First Team Forward',
      club: 'Real Madrid CF',
      location: 'Madrid, Spain',
      category: 'football',
      position: 'Forward',
      description: 'Seeking a world-class forward to strengthen our attacking options. Must have proven goal-scoring record at the highest level.',
      salary: '£300k-£400k per week',
      type: 'Professional'
    });
    
    await db.insert(opportunities).values({
      title: 'Performance Analyst',
      club: 'Ajax Amsterdam',
      location: 'Amsterdam, Netherlands',
      category: 'staff',
      position: 'Analyst',
      description: 'Join our performance analysis team to help provide insights on team and individual player performance. Experience with video analysis software required.',
      salary: '€50k-€70k per year',
      type: 'Support Staff'
    });
    
    console.log('Creating events...');
    
    // Events
    await db.insert(events).values({
      title: 'International Scouting Combine',
      description: 'A three-day event where players can showcase their skills in front of scouts from top European clubs.',
      date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      location: 'London, UK',
      type: 'Scouting'
    });
    
    await db.insert(events).values({
      title: 'UEFA Pro License Course',
      description: 'Start your journey to obtaining the highest coaching qualification in European football.',
      date: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      location: 'Nyon, Switzerland',
      type: 'Education'
    });
    
    await db.insert(events).values({
      title: 'Youth Development Conference',
      description: 'Join top academy directors and youth coaches to discuss best practices in developing young talent.',
      date: new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      location: 'Amsterdam, Netherlands',
      type: 'Conference'
    });
    
    await db.insert(events).values({
      title: 'Women\'s Football Coaching Workshop',
      description: 'A specialized workshop focusing on coaching in the women\'s game, led by top coaches from women\'s football.',
      date: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      location: 'Lyon, France',
      type: 'Workshop'
    });
    
    console.log('Creating messages...');
    
    // Messages
    await db.insert(messages).values({
      senderId: cristianoRonaldo.id,
      receiverId: davidBeckham.id,
      content: 'Hey David, how are things going with Inter Miami?',
      read: true
    });
    
    await db.insert(messages).values({
      senderId: davidBeckham.id,
      receiverId: cristianoRonaldo.id,
      content: 'Going great! We\'re building something special here. You should come visit sometime.',
      read: true
    });
    
    await db.insert(messages).values({
      senderId: lionelMessi.id,
      receiverId: davidBeckham.id,
      content: 'Thanks for everything you\'ve done to make me feel welcome in Miami!',
      read: false
    });
    
    await db.insert(messages).values({
      senderId: pepGuardiola.id,
      receiverId: erlingHaaland.id,
      content: 'Great performance yesterday. Let\'s review your positioning in tomorrow\'s training session.',
      read: true
    });
    
    await db.insert(messages).values({
      senderId: realMadrid.id,
      receiverId: kylianMbappe.id,
      content: 'Welcome to Real Madrid! The team is excited to have you joining us.',
      read: true
    });
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export { main as seedDatabase };