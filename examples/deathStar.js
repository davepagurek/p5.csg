let deathStar

function setup() {
  createCanvas(400, 400, WEBGL)

  deathStar = csg(() => sphere(50))
    .subtract(() => {
      translate(40, -40)
      sphere(25)
    })
    .union(() => sphere(40))
    .done()
}

function draw() {
  clear()
  orbitControl()
  noStroke()
  lights()
  model(deathStar)
}
