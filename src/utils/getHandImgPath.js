/**
 * 渲染所有手势的图片路径
 */
const fs = require('fs')
const path = require('path')

const directoryPath = path.join(__dirname, '../../public/images/hands') // 图片路径
const pathPrefix = '/images/hands/' // 添加相对路径前缀

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error('Unable to scan directory:', err)
  }

  // 分类文件到左右手
  const groupedFiles = {
    left: files
      .filter(file => /_Left\.png$/i.test(file))
      .map(file => pathPrefix + file),
    right: files
      .filter(file => /_Right\.png$/i.test(file))
      .map(file => pathPrefix + file)
  }

  // 写入JSON文件
  fs.writeFileSync(
    './hands-paths.json', // 输出路径
    JSON.stringify(groupedFiles, null, 2),
    'utf8',
    (err) => {
      if (err) throw err
      console.log('hands-paths.json has been saved!')
    }
  )
})
