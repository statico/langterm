const loadImage = async (url) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.src = url
    image.onerror = reject
    image.onload = () => {
      resolve(image)
    }
  })
}

const loadText = async (url) => fetch(url).then((res) => res.text())

// Given an object of names to URLs, return an object of names to the contents
// at that URL.
const loadAssets = async (assets) => {
  const result = {}
  const promises = Object.keys(assets).map((key) => {
    const url = assets[key]
    const fn = /\.(png|jpg)$/.test(url) ? loadImage : loadText
    return (async () => {
      result[key] = await fn(url)
    })()
  })
  await Promise.all(promises)
  return result
}
