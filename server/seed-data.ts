// FootballConnect Seed Data
// This script populates the database with sample data for posts, comments, likes, connections, opportunities, and events

import { db } from './db';
import supabase from './supabase';

// Types import
import {
  InsertPost,
  InsertComment,
  InsertConnection,
  InsertOpportunity,
  InsertEvent
} from '../shared/schema';

async function seedData() {
  console.log('Starting comprehensive data seeding...');

  try {
    // Fetch existing users to associate with new data
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, full_name');
    
    if (userError) {
      throw userError;
    }

    if (!users || users.length < 2) {
      console.error('Not enough users found. Please seed users first using seed-users-data.ts');
      return;
    }

    console.log(`Found ${users.length} users to work with`);
    
    // ------------ POSTS -------------
    console.log('Creating posts...');
    
    // Clear existing posts first
    await supabase.from('posts').delete().neq('id', 0);
    
    const postTypes = ['text', 'video', 'achievement', 'stats'];
    const postContents = [
      'Great training session today! Working on improving my ball control.',
      'Just signed with my new club! Excited for this new chapter in my career.',
      'Match day tomorrow. Feeling ready and focused!',
      'Analyzing my performance from last weekend. Always room for improvement.',
      'Working on my finishing technique. Practice makes perfect.'
    ];
    
    // Media URLs for video posts
    const mediaUrls = [
      'https://source.unsplash.com/random/800x600/?football,goal',
      'https://source.unsplash.com/random/800x600/?soccer,match',
      'https://source.unsplash.com/random/800x600/?football,training',
      'https://source.unsplash.com/random/800x600/?soccer,stadium'
    ];
    
    // Achievement data
    const achievements = [
      { title: 'Player of the Month', subtitle: 'League One - March 2023' },
      { title: 'Goal of the Season', subtitle: 'Premier League 2022/23' },
      { title: '100 Appearances', subtitle: 'Club Milestone' },
      { title: 'Clean Sheet Record', subtitle: '10 consecutive matches' }
    ];
    
    // Stats data
    const statsData = [
      { goals: 12, assists: 8, matches: 20, passAccuracy: 87 },
      { goals: 5, assists: 15, matches: 18, passAccuracy: 92 },
      { cleanSheets: 14, saves: 82, matchesPlayed: 22 },
      { tackles: 45, interceptions: 56, passAccuracy: 76, matches: 19 }
    ];
    
    // Create various posts for each user
    const posts = [];
    for (const user of users) {
      // Create 3-5 posts per user
      const postCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < postCount; i++) {
        const postType = postTypes[Math.floor(Math.random() * postTypes.length)];
        const content = postContents[Math.floor(Math.random() * postContents.length)];
        
        let postData: InsertPost = {
          author_id: user.id,
          content,
          type: postType
        };
        
        // Add type-specific data
        if (postType === 'video') {
          postData.media_url = mediaUrls[Math.floor(Math.random() * mediaUrls.length)];
        } else if (postType === 'achievement') {
          const achievement = achievements[Math.floor(Math.random() * achievements.length)];
          postData.achievement_title = achievement.title;
          postData.achievement_subtitle = achievement.subtitle;
        } else if (postType === 'stats') {
          postData.stats_data = statsData[Math.floor(Math.random() * statsData.length)];
        }
        
        // Insert post
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert(postData)
          .select()
          .single();
        
        if (postError) {
          console.error('Error creating post:', postError);
        } else {
          console.log(`Created post id ${post.id} for user ${user.username}`);
          posts.push(post);
        }
      }
    }
    
    // ------------ COMMENTS -------------
    console.log('Adding comments to posts...');
    
    // Clear existing comments first
    await supabase.from('comments').delete().neq('id', 0);
    
    const commentContents = [
      'Great work!',
      'Keep it up!',
      'Looking forward to seeing more from you!',
      'Impressive skills!',
      'Thats fantastic progress!',
      'Well done!',
      'Amazing technique!',
      'Can you share some tips?',
      'Congratulations on the achievement!',
      'Your hard work is paying off!'
    ];
    
    // Add 1-3 comments to each post
    for (const post of posts) {
      // Determine how many comments this post will have
      const commentCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < commentCount; i++) {
        // Pick a random user to be the comment author (not the post author)
        const availableCommenters = users.filter(u => u.id !== post.author_id);
        const commenter = availableCommenters[Math.floor(Math.random() * availableCommenters.length)];
        
        const commentData: InsertComment = {
          post_id: post.id,
          author_id: commenter.id,
          content: commentContents[Math.floor(Math.random() * commentContents.length)]
        };
        
        // Insert comment
        const { error: commentError } = await supabase
          .from('comments')
          .insert(commentData);
        
        if (commentError) {
          console.error('Error creating comment:', commentError);
        }
      }
    }
    console.log('Comments added successfully!');
    
    // ------------ LIKES -------------
    console.log('Adding likes to posts...');
    
    // Clear existing likes first
    await supabase.from('likes').delete().neq('id', 0);
    
    // For each post, add 0-5 random likes from users
    for (const post of posts) {
      // Skip likes for some posts to have variation
      if (Math.random() < 0.1) continue;
      
      // Determine how many likes this post will have
      const likeCount = Math.floor(Math.random() * 5) + 1;
      
      // Get users who can like this post (not the author)
      const potentialLikers = users.filter(u => u.id !== post.author_id);
      
      // Randomly select users to like the post
      const likers: typeof users = [];
      while (likers.length < likeCount && likers.length < potentialLikers.length) {
        const randomUser = potentialLikers[Math.floor(Math.random() * potentialLikers.length)];
        if (!likers.some(u => u.id === randomUser.id)) {
          likers.push(randomUser);
        }
      }
      
      // Create likes
      for (const liker of likers) {
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: liker.id
          });
        
        if (likeError) {
          console.error('Error creating like:', likeError);
        } else {
          // Update post like count using SQL RPC function
          await supabase.rpc('increment_likes', { row_id: post.id });
        }
      }
    }
    console.log('Likes added successfully!');
    
    // ------------ CONNECTIONS -------------
    console.log('Creating connections between users...');
    
    // Clear existing connections first
    await supabase.from('connections').delete().neq('id', 0);
    
    // Create connections between users
    // For small number of users, connect all users
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        // Create connections with various statuses
        const statuses = ['pending', 'accepted', 'declined'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Randomly determine requester and receiver
        let requester_id, receiver_id;
        if (Math.random() > 0.5) {
          requester_id = users[i].id;
          receiver_id = users[j].id;
        } else {
          requester_id = users[j].id;
          receiver_id = users[i].id;
        }
        
        const connectionData: InsertConnection = {
          requester_id,
          receiver_id
        };
        
        const { data: connection, error: connectionError } = await supabase
          .from('connections')
          .insert(connectionData)
          .select()
          .single();
        
        if (connectionError) {
          console.error('Error creating connection:', connectionError);
        } else {
          // Update status if not pending
          if (status !== 'pending') {
            await supabase
              .from('connections')
              .update({ status })
              .eq('id', connection.id);
          }
          
          console.log(`Created ${status} connection between ${requester_id} and ${receiver_id}`);
        }
      }
    }
    
    // ------------ OPPORTUNITIES -------------
    console.log('Creating football opportunities...');
    
    // Clear existing opportunities first
    await supabase.from('opportunities').delete().neq('id', 0);
    
    const opportunitiesData = [
      {
        title: 'First Team Goalkeeper',
        club: 'Manchester United FC',
        location: 'Manchester, UK',
        category: 'football',
        position: 'Goalkeeper',
        description: 'Looking for an experienced goalkeeper to join our first team squad.',
        salary: '£50,000-£80,000/week',
        type: 'Job'
      },
      {
        title: 'Youth Academy Trials',
        club: 'FC Barcelona',
        location: 'Barcelona, Spain',
        category: 'football',
        position: 'All Positions',
        description: 'Open trials for talented young players aged 15-18 for our prestigious academy.',
        type: 'Trial'
      },
      {
        title: 'Technical Coach',
        club: 'Ajax Amsterdam',
        location: 'Amsterdam, Netherlands',
        category: 'training',
        description: 'Seeking an experienced technical skills coach to work with our youth development program.',
        salary: '€70,000/year',
        type: 'Job'
      },
      {
        title: 'Defensive Midfielder',
        club: 'Juventus FC',
        location: 'Turin, Italy',
        category: 'football',
        position: 'Defensive Midfielder',
        description: 'Seeking a strong defensive midfielder with excellent passing abilities for immediate first team integration.',
        salary: '€75,000-€100,000/week',
        type: 'Job'
      },
      {
        title: 'Pre-Season Training Camp',
        club: 'Elite Football Academy',
        location: 'Lisbon, Portugal',
        category: 'training',
        position: 'All Positions',
        description: 'Two-week intensive training camp led by former professional players and UEFA-licensed coaches.',
        type: 'Training'
      }
    ];
    
    for (const opportunityData of opportunitiesData) {
      const { error: opportunityError } = await supabase
        .from('opportunities')
        .insert(opportunityData);
      
      if (opportunityError) {
        console.error('Error creating opportunity:', opportunityError);
      }
    }
    console.log('Opportunities created successfully!');
    
    // ------------ EVENTS -------------
    console.log('Creating events...');
    
    // Clear existing events first
    await supabase.from('events').delete().neq('id', 0);
    
    const now = new Date();
    const eventsData = [
      {
        title: 'Football Career Expo 2023',
        description: 'Connect with clubs, scouts and agencies from across Europe at this premier networking event.',
        date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        location: 'London, UK',
        type: 'networking'
      },
      {
        title: 'Scouting Showcase',
        description: 'Showcase your skills in front of scouts from top European clubs.',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'Madrid, Spain',
        type: 'trial'
      },
      {
        title: 'Youth Development Workshop',
        description: 'Learn the latest training methods for young players from UEFA certified coaches.',
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
        location: 'Amsterdam, Netherlands',
        type: 'training'
      },
      {
        title: 'Champions League Final Watch Party',
        description: 'Join fellow professionals to watch the year\'s biggest match and network with industry peers.',
        date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        location: 'Berlin, Germany',
        type: 'social'
      },
      {
        title: 'Technical Skills Masterclass',
        description: 'A day of intensive training focused on technical skills and tactical awareness.',
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        location: 'Lyon, France',
        type: 'training'
      }
    ];
    
    for (const eventData of eventsData) {
      const { error: eventError } = await supabase
        .from('events')
        .insert(eventData);
      
      if (eventError) {
        console.error('Error creating event:', eventError);
      }
    }
    console.log('Events created successfully!');
    
    console.log('Data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error during data seeding:', error);
  }
}

export { seedData as seedContentDatabase };