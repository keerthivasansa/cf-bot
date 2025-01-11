import { createDynamicImages } from "../discord/utils/dynamicImages";
import fs from 'fs';
import path from 'path';

async function testDynamicImages() {
    // Test data
    const data = [
        ["1", "UserOne", "1500"],
        ["2", "UserTwo", "1600"],
        ["3", "UserThree", "1700"],
        ["4", "UserFour", "1800"],
        ["5", "UserFive", "1900"],
        ["6", "UserSix", "2000"],
        ["7", "UserSeven", "2100"],
        ["8", "UserEight", "2200"],
        ["9", "UserNine", "2300"],
        ["10", "UserTen", "2400"],
        ["11", "UserEleven", "2500"],
        ["12", "UserTwelve", "2600"],
        ["13", "UserThirteen", "2700"],
        ["14", "UserFourteen", "2800"],
        ["15", "UserFifteen", "2900"],
        ["16", "UserSixteen", "3000"],
        ["17", "UserSeventeen", "3100"],
        ["18", "UserEighteen", "3200"],
        ["19", "UserNineteen", "3300"],
        ["20", "UserTwenty", "3400"],
        ["21", "UserTwentyOne", "3500"],
        ["22", "UserTwentyTwo", "3600"],
        ["23", "UserTwentyThree", "3700"],
        ["24", "UserTwentyFour", "3800"],
        ["25", "UserTwentyFive", "3900"],
        ["26", "UserTwentySix", "4000"],
        ["27", "UserTwentySeven", "4100"],
        ["28", "UserTwentyEight", "4200"],
        ["29", "UserTwentyNine", "4300"],
        ["30", "UserThirty", "4400"],
        ["31", "UserThirtyOne", "4500"],
        ["32", "UserThirtyTwo", "4600"],
        ["33", "UserThirtyThree", "4700"],
        ["34", "UserThirtyFour", "4800"],
        ["35", "UserThirtyFive", "4900"],
        ["36", "UserThirtySix", "5000"],
        ["37", "UserThirtySeven", "5100"],
        ["38", "UserThirtyEight", "5200"],
        ["39", "UserThirtyNine", "5300"],
        ["40", "UserForty", "5400"],
        ["41", "UserFortyOne", "5500"],
        ["42", "UserFortyTwo", "5600"],
        ["43", "UserFortyThree", "5700"],
        ["44", "UserFortyFour", "5800"],
        ["45", "UserFortyFive", "5900"],
        ["46", "UserFortySix", "6000"],
        ["47", "UserFortySeven", "6100"],
        ["48", "UserFortyEight", "6200"],
        ["49", "UserFortyNine", "6300"],
        ["50", "UserFifty", "6400"],
    ];

    const config = {
        head: ["Rank", "Username", "Rating"],
        colWidths: [60, 200, 100],
    };

    // Generate images
    const images = await createDynamicImages(data, config);

    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Save each image
    images.forEach((imageBuffer, index) => {
        const filePath = path.join(outputDir, `table_${index + 1}.png`);
        fs.writeFileSync(filePath, imageBuffer);
        console.log(`Generated image ${index + 1} at: ${filePath}`);
    });
}

// Run the test
testDynamicImages()
    .then(() => console.log('Test completed successfully'))
    .catch(err => console.error('Test failed:', err));