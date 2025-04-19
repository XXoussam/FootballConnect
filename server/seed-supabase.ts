import supabase from './supabase';
import { hash } from './utils';

/**
 * Seed the Supabase database with sample data
 * This script assumes tables are already created in the Supabase SQL Editor
 */
async function main() {
  console.log('Starting Supabase database seeding...');

  try {
    console.log('Creating users...');
    
    // Create users
    const { data: davidBeckham } = await supabase
      .from('users')
      .insert({
        username: 'davidbeckham',
        password: await hash('password123'),
        full_name: 'David Beckham',
        position: 'Midfielder',
        club: 'Inter Miami CF (Owner)',
        location: 'Miami, USA',
        bio: 'Former professional footballer and current President & Co-Owner of Inter Miami CF.',
        avatar_url: 'https://i.imgur.com/PN8XzLO.jpg',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: cristianoRonaldo } = await supabase
      .from('users')
      .insert({
        username: 'cristiano',
        password: await hash('password123'),
        full_name: 'Cristiano Ronaldo',
        position: 'Forward',
        club: 'Al Nassr FC',
        location: 'Riyadh, Saudi Arabia',
        bio: 'Professional footballer. Five-time Ballon d\'Or winner.',
        avatar_url: 'https://i.imgur.com/HRVvKK2.jpg',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: lionelMessi } = await supabase
      .from('users')
      .insert({
        username: 'leomessi',
        password: await hash('password123'),
        full_name: 'Lionel Messi',
        position: 'Forward',
        club: 'Inter Miami CF',
        location: 'Miami, USA',
        bio: 'Professional footballer. World Cup champion.',
        avatar_url: 'https://i.imgur.com/PCoZEGH.jpg',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: pepGuardiola } = await supabase
      .from('users')
      .insert({
        username: 'pepguardiola',
        password: await hash('password123'),
        full_name: 'Pep Guardiola',
        position: 'Manager',
        club: 'Manchester City',
        location: 'Manchester, UK',
        bio: 'Football manager and former player. Multiple Premier League and Champions League winner.',
        avatar_url: 'https://i.imgur.com/U9KlKZo.jpg',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: erlingHaaland } = await supabase
      .from('users')
      .insert({
        username: 'erlinghaaland',
        password: await hash('password123'),
        full_name: 'Erling Haaland',
        position: 'Forward',
        club: 'Manchester City',
        location: 'Manchester, UK',
        bio: 'Professional footballer. Top goalscorer.',
        avatar_url: 'https://i.imgur.com/bOMxzXs.jpg',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: kylianMbappe } = await supabase
      .from('users')
      .insert({
        username: 'kylianmbappe',
        password: await hash('password123'),
        full_name: 'Kylian Mbappé',
        position: 'Forward',
        club: 'Real Madrid',
        location: 'Madrid, Spain',
        bio: 'Professional footballer. World Cup winner with France.',
        avatar_url: 'https://i.imgur.com/OI5UvnM.jpg',
        verified: true,
        is_pro: true
      })
      .select()
      .single();

    const { data: realMadrid } = await supabase
      .from('users')
      .insert({
        username: 'realmadrid',
        password: await hash('password123'),
        full_name: 'Real Madrid CF',
        position: 'Club',
        club: 'Real Madrid CF',
        location: 'Madrid, Spain',
        bio: 'Official account of Real Madrid Club de Fútbol. 14-time Champions League winners.',
        avatar_url: 'https://i.imgur.com/wMnNVLF.png',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: barcelonaFC } = await supabase
      .from('users')
      .insert({
        username: 'fcbarcelona',
        password: await hash('password123'),
        full_name: 'FC Barcelona',
        position: 'Club',
        club: 'FC Barcelona',
        location: 'Barcelona, Spain',
        bio: 'Official account of FC Barcelona. Més que un club.',
        avatar_url: 'https://i.imgur.com/0BzKfYW.png',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: manchesterUnited } = await supabase
      .from('users')
      .insert({
        username: 'manutd',
        password: await hash('password123'),
        full_name: 'Manchester United',
        position: 'Club',
        club: 'Manchester United',
        location: 'Manchester, UK',
        bio: 'Official account of Manchester United. #MUFC',
        avatar_url: 'https://i.imgur.com/bBG48H8.png',
        verified: true,
        is_pro: true
      })
      .select()
      .single();
    
    const { data: johnDoe } = await supabase
      .from('users')
      .insert({
        username: 'johndoe',
        password: await hash('password123'),
        full_name: 'John Doe',
        position: 'Forward',
        club: 'Local FC',
        location: 'London, UK',
        bio: 'Aspiring footballer looking for opportunities.',
        avatar_url: 'https://i.imgur.com/6YWUd7g.jpg',
        verified: false,
        is_pro: false
      })
      .select()
      .single();
    
    console.log('Creating posts...');
    
    // Posts
    const { data: post1 } = await supabase
      .from('posts')
      .insert({
        author_id: davidBeckham.id,
        content: 'Excited to announce our new signing at Inter Miami CF! #MLS #Football',
        type: 'text',
        likes: 0
      })
      .select()
      .single();
    
    const { data: post2 } = await supabase
      .from('posts')
      .insert({
        author_id: cristianoRonaldo.id,
        content: 'Just finished an intense training session. Always pushing to be better! 💪',
        type: 'text',
        likes: 0
      })
      .select()
      .single();
    
    const { data: post3 } = await supabase
      .from('posts')
      .insert({
        author_id: lionelMessi.id,
        content: 'Happy to score my 500th career goal today. Thanks to all the fans for your support! ⚽',
        type: 'achievement',
        achievement_title: '500 Career Goals',
        achievement_subtitle: 'Career Milestone',
        likes: 0
      })
      .select()
      .single();
    
    // More posts
    await supabase
      .from('posts')
      .insert([
        {
          author_id: pepGuardiola.id,
          content: 'Proud of the team\'s performance today. Great effort from everyone.',
          type: 'text',
          likes: 0
        },
        {
          author_id: erlingHaaland.id,
          content: 'My stats from this season so far!',
          type: 'stats',
          stats_data: {
            goals: 25,
            assists: 5,
            matchesPlayed: 20
          },
          likes: 0
        },
        {
          author_id: kylianMbappe.id,
          content: 'Excited for the new challenge at Real Madrid! Looking forward to making history together. #HalaMadrid',
          type: 'text',
          likes: 0
        },
        {
          author_id: realMadrid.id,
          content: 'Congratulations to our team for winning the Champions League! 🏆 #ChampionsLeague #RealMadrid',
          type: 'achievement',
          achievement_title: 'Champions League Winners',
          achievement_subtitle: 'Club Achievement',
          likes: 0
        }
      ]);
    
    console.log('Creating comments...');
    
    // Comments
    await supabase
      .from('comments')
      .insert([
        {
          post_id: post1.id,
          author_id: cristianoRonaldo.id,
          content: 'Great news! Looking forward to seeing the new talent.'
        },
        {
          post_id: post2.id,
          author_id: lionelMessi.id,
          content: 'Keep up the hard work! 💯'
        },
        {
          post_id: post3.id,
          author_id: davidBeckham.id,
          content: 'Congratulations Leo! Amazing achievement.'
        },
        {
          post_id: post3.id,
          author_id: cristianoRonaldo.id,
          content: 'Congrats! Welcome to the 500 club.'
        }
      ]);
    
    console.log('Creating likes...');
    
    // Likes
    await supabase
      .from('likes')
      .insert([
        {
          post_id: post1.id,
          user_id: cristianoRonaldo.id
        },
        {
          post_id: post1.id,
          user_id: lionelMessi.id
        },
        {
          post_id: post2.id,
          user_id: davidBeckham.id
        },
        {
          post_id: post3.id,
          user_id: cristianoRonaldo.id
        },
        {
          post_id: post3.id,
          user_id: davidBeckham.id
        }
      ]);
    
    console.log('Creating connections...');
    
    // Connections
    await supabase
      .from('connections')
      .insert([
        {
          requester_id: davidBeckham.id,
          receiver_id: cristianoRonaldo.id,
          status: 'accepted'
        },
        {
          requester_id: davidBeckham.id,
          receiver_id: lionelMessi.id,
          status: 'accepted'
        },
        {
          requester_id: cristianoRonaldo.id,
          receiver_id: lionelMessi.id,
          status: 'accepted'
        },
        {
          requester_id: johnDoe.id,
          receiver_id: davidBeckham.id,
          status: 'pending'
        }
      ]);
    
    console.log('Creating opportunities...');
    
    // Opportunities
    await supabase
      .from('opportunities')
      .insert([
        {
          title: 'First Team Midfielder',
          club: 'Manchester City',
          location: 'Manchester, UK',
          category: 'football',
          position: 'Midfielder',
          description: 'Seeking an experienced midfielder with exceptional passing ability and vision to join our first team. Premier League and Champions League experience preferred.',
          salary: '£200k-£300k per week',
          type: 'Professional'
        },
        {
          title: 'Youth Academy Trials',
          club: 'FC Barcelona',
          location: 'Barcelona, Spain',
          category: 'academy',
          position: 'Various',
          description: 'La Masia is holding trials for talented young players aged 12-16. This is your chance to join one of the world\'s most prestigious football academies.',
          salary: null,
          type: 'Youth Development'
        },
        {
          title: 'Goalkeeper Coach',
          club: 'Liverpool FC',
          location: 'Liverpool, UK',
          category: 'coaching',
          position: 'Coach',
          description: 'Looking for an experienced goalkeeper coach to work with our senior team. UEFA Pro License required.',
          salary: '£75k-£100k per year',
          type: 'Coaching Staff'
        }
      ]);
    
    console.log('Creating events...');
    
    // Events
    await supabase
      .from('events')
      .insert([
        {
          title: 'International Scouting Combine',
          description: 'A three-day event where players can showcase their skills in front of scouts from top European clubs.',
          date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          location: 'London, UK',
          type: 'Scouting'
        },
        {
          title: 'UEFA Pro License Course',
          description: 'Start your journey to obtaining the highest coaching qualification in European football.',
          date: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          location: 'Nyon, Switzerland',
          type: 'Education'
        }
      ]);
    
    console.log('Creating messages...');
    
    // Messages
    await supabase
      .from('messages')
      .insert([
        {
          sender_id: cristianoRonaldo.id,
          receiver_id: davidBeckham.id,
          content: 'Hey David, how are things going with Inter Miami?',
          read: true
        },
        {
          sender_id: davidBeckham.id,
          receiver_id: cristianoRonaldo.id,
          content: 'Going great! We\'re building something special here. You should come visit sometime.',
          read: true
        },
        {
          sender_id: lionelMessi.id,
          receiver_id: davidBeckham.id,
          content: 'Thanks for everything you\'ve done to make me feel welcome in Miami!',
          read: false
        }
      ]);
    
    console.log('Supabase seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    console.error(error);
  }
}

// Execute the seed function
main();