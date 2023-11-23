/**
 * 渲染所有手势的图片路径
 * (放弃添加前缀，省得选择手势的时候还要提取
 * 但渲染图片的时候记得手动添加前缀）
 */

const fs = require('fs')
const path = require('path')

const directoryPath = path.join(__dirname, '../../public/images/hands') // 图片路径

// 排除部分手势不支持让用户自定义
const excludeFiles = ["Pointing_Up_Left.png", "Pointing_Up_Right.png"];

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error('Unable to scan directory:', err)
  }

  // 分类文件到左右手
  const groupedFiles = {
    left: files
      .filter(file => /_Left\.png$/i.test(file) && !excludeFiles.includes(file))
      .map(file => path.basename(file, '.png')), // 移除文件后缀
    right: files
      .filter(
        file => /_Right\.png$/i.test(file) && !excludeFiles.includes(file)
      )
      .map(file => path.basename(file, '.png'))
  }

  // 写入JSON文件
  fs.writeFileSync(
    './hands-paths.json', // 输出路径
    JSON.stringify(groupedFiles, null, 2),
    'utf8',
    err => {
      if (err) throw err
      console.log('hands-paths.json has been saved!')
    }
  )
})
