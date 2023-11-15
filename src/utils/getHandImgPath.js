/**
 * 渲染所有手势的图片路径
 */
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../../public/images/hands'); // 图片路径
const pathPrefix = 'images/hands/'; // 添加相对路径前缀

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.error('Unable to scan directory:', err);
    }

    const imageFiles = files.filter(file => /\.(png|jpg|jpeg|svg)$/i.test(file));

    const groupedFiles = {
        left: imageFiles.filter(file => /^left-/i.test(file)).map(file => pathPrefix + file),
        right: imageFiles.filter(file => /^right-/i.test(file)).map(file => pathPrefix + file)
    };

    fs.writeFileSync('../config/imagePaths.json', JSON.stringify(groupedFiles, null, 2), 'utf8', err => {
        if (err) throw err;
        console.log('imagePaths.json has been saved!');
    });
});
