function alertNewLevel(curr_rating: number, max_rating: number): string | null {
    const levels = [
        { name: "Tourist", minRating: 4000 },
        { name: "Legendary Grandmaster", minRating: 3000 },
        { name: "International Grandmaster", minRating: 2600 },
        { name: "Grandmaster", minRating: 2400 },
        { name: "International Master", minRating: 2300 },
        { name: "Master", minRating: 2100 },
        { name: "Candidate Master", minRating: 1900 },
        { name: "Expert", minRating: 1600 },
        { name: "Specialist", minRating: 1400 },
        { name: "Pupil", minRating: 1200 },
        { name: "Newbie", minRating: 0 }
    ];

    if (curr_rating > max_rating) {
        const newLevel = levels.find(level => curr_rating >= level.minRating);
        
        if (newLevel) {
            return `🎉 Congratulations! You've reached a new level: ${newLevel.name} with a rating of ${curr_rating}! Keep up the great work! 🎉`;
        }
    }
    
    return null;
}

console.log( alertNewLevel(1204, 1100));

