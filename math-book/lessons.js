/* Lessons: a chat tutor (Pip) that teaches a topic and asks word problems. */
(function () {
  "use strict";
  const { h, fmt } = window.Calc;
  const M = window.MATH;
  const hid = id => id.replace(/_/g, "-");

  /* ---------------- Helpers for word problems ---------------- */
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const NAMES = ["Maya", "Leo", "Ava", "Sam", "Zara", "Omar", "Ivy", "Noah", "Priya", "Kai", "Lena", "Theo", "Rosa", "Finn"];
  const name = () => pick(NAMES);
  const r1 = v => Math.round(v * 10) / 10;
  const r2 = v => Math.round(v * 100) / 100;
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]];

  /* Each generator returns { q, a, hint, work, unit?, tol? }. */
  const LESSONS = [
    { id: "add", title: "Adding big numbers", sym: "+", level: "Starter", entry: "add",
      blurb: "Line up the columns and carry the 1.",
      teach: [
        "Adding means putting amounts together. When numbers get big, we add them in columns: ones under ones, tens under tens.",
        "Start on the right with the ones. If a column adds to 10 or more, write the ones digit and carry the 1 to the next column. Example: 47 + 38. Ones: 7 + 8 = 15, write 5, carry 1. Tens: 4 + 3 + 1 = 8. Answer: `85`."
      ],
      gens: [
        () => { const a = rnd(120, 680), b = rnd(110, 390), n = name(); return { q: n + "’s school library has " + a + " books. It gets " + b + " new books. How many books does it have now?", a: a + b, unit: "books", hint: "Add " + a + " + " + b + " column by column, starting with the ones.", work: a + " + " + b + " = " + (a + b) }; },
        () => { const a = rnd(25, 95), b = rnd(25, 95), c = rnd(10, 60); return { q: "A bakery sells " + a + " muffins on Monday, " + b + " on Tuesday and " + c + " on Wednesday. How many muffins is that altogether?", a: a + b + c, unit: "muffins", hint: "Add the first two days, then add Wednesday.", work: a + " + " + b + " = " + (a + b) + ", then + " + c + " = " + (a + b + c) }; },
        () => { const a = rnd(1200, 4800), b = rnd(900, 3900), n = name(); return { q: n + " walked " + a + " steps in the morning and " + b + " steps in the afternoon. How many steps in total?", a: a + b, unit: "steps", hint: "Line up the thousands, hundreds, tens and ones, then add from the right.", work: a + " + " + b + " = " + (a + b) }; },
        () => { const a = rnd(140, 480), b = rnd(140, 480); return { q: "A train has " + a + " people on it. At the next station " + b + " more get on and nobody gets off. How many people are on the train?", a: a + b, unit: "people", hint: "More people getting on means add.", work: a + " + " + b + " = " + (a + b) }; }
      ] },
    { id: "sub", title: "Taking away", sym: "−", level: "Starter", entry: "sub",
      blurb: "Subtract in columns and borrow when you need to.",
      teach: [
        "Subtraction means taking away, or finding the difference between two amounts. It undoes addition: if 5 + 3 = 8, then 8 − 3 = 5.",
        "With big numbers, subtract column by column from the right. If the top digit is too small, borrow 1 from the next column (it becomes 10 here). Example: 52 − 17. Ones: 2 is less than 7, so borrow: 12 − 7 = 5. Tens: 4 − 1 = 3. Answer: `35`."
      ],
      gens: [
        () => { const a = rnd(300, 900), b = rnd(100, a - 50), n = name(); return { q: n + " had " + a + " stickers and gave away " + b + ". How many stickers are left?", a: a - b, unit: "stickers", hint: "Gave away means take away: " + a + " − " + b + ".", work: a + " − " + b + " = " + (a - b) }; },
        () => { const a = rnd(180, 420), b = rnd(40, a - 20); return { q: "A cinema has " + a + " seats. " + b + " seats are taken. How many seats are empty?", a: a - b, unit: "seats", hint: "Empty seats = all seats − taken seats.", work: a + " − " + b + " = " + (a - b) }; },
        () => { const a = rnd(1950, 2015), b = rnd(2030, 2060); return { q: "A tree was planted in " + a + ". How old will it be in " + b + "?", a: b - a, unit: "years", hint: "Find the difference: " + b + " − " + a + ".", work: b + " − " + a + " = " + (b - a) }; },
        () => { const a = rnd(50, 200), b = rnd(10, a - 5), n = name(); return { q: n + " has $" + a + " and buys a game for $" + b + ". How much money is left?", a: a - b, unit: "dollars", hint: "Spending money takes it away.", work: a + " − " + b + " = " + (a - b) }; }
      ] },
    { id: "mul", title: "Multiplication", sym: "×", level: "Starter", entry: "mul",
      blurb: "Repeated addition, rows and columns.",
      teach: [
        "Multiplication is repeated addition. 4 × 3 means four groups of three: 3 + 3 + 3 + 3 = `12`.",
        "Picture it as rows and columns. A box with 4 rows of 3 eggs holds 4 × 3 = 12 eggs. Turn the box around and it’s 3 rows of 4: still 12. Order doesn’t matter in multiplication."
      ],
      gens: [
        () => { const a = rnd(4, 12), b = rnd(6, 24), n = name(); return { q: n + " buys " + a + " packs of pencils. Each pack has " + b + " pencils. How many pencils is that?", a: a * b, unit: "pencils", hint: a + " packs of " + b + " means " + a + " × " + b + ".", work: a + " × " + b + " = " + a * b }; },
        () => { const r = rnd(8, 25), s = rnd(10, 30); return { q: "A theatre has " + r + " rows with " + s + " seats in each row. How many seats are there?", a: r * s, unit: "seats", hint: "Rows × seats in each row.", work: r + " × " + s + " = " + r * s }; },
        () => { const w = rnd(3, 9), d = 7; return { q: "A puppy sleeps " + w + " hours every afternoon. How many hours of afternoon naps is that in one week?", a: w * d, unit: "hours", hint: "A week has 7 days.", work: w + " × 7 = " + w * 7 }; },
        () => { const p = rnd(3, 15), n = rnd(4, 12); return { q: "Tickets to the zoo cost $" + p + " each. How much do " + n + " tickets cost?", a: p * n, unit: "dollars", hint: "Multiply the price by the number of tickets.", work: n + " × " + p + " = " + p * n }; }
      ] },
    { id: "div", title: "Division and sharing", sym: "÷", level: "Starter", entry: "div",
      blurb: "Share equally and deal with remainders.",
      teach: [
        "Division means sharing equally. 12 ÷ 3 asks: if 12 sweets are shared between 3 friends, how many does each get? Answer: `4`.",
        "Division undoes multiplication: 12 ÷ 3 = 4 because 3 × 4 = 12. Sometimes there’s some left over, called the remainder. 14 ÷ 3 = 4 remainder 2."
      ],
      gens: [
        () => { const k = rnd(3, 9), each = rnd(4, 15), n = name(); return { q: n + " shares " + k * each + " marbles equally between " + k + " friends. How many marbles does each friend get?", a: each, unit: "marbles", hint: "What number times " + k + " makes " + k * each + "?", work: k * each + " ÷ " + k + " = " + each }; },
        () => { const k = rnd(4, 8), teams = rnd(4, 9), extra = rnd(1, k - 1), total = k * teams + extra; return { q: total + " students are split into teams of " + k + ". How many full teams can be made?", a: teams, unit: "teams", hint: "Divide " + total + " by " + k + " and ignore the remainder.", work: total + " ÷ " + k + " = " + teams + " remainder " + extra + ", so " + teams + " full teams" }; },
        () => { const k = rnd(4, 8), cars = rnd(3, 9), extra = rnd(1, k - 1), total = k * cars + extra; return { q: total + " people need to get to a party. Each car fits " + k + " people. How many cars are needed so everyone gets there?", a: cars + 1, unit: "cars", hint: "Divide, then think about the people left over. They need a car too!", work: total + " ÷ " + k + " = " + cars + " remainder " + extra + ". The " + extra + " left over need one more car: " + (cars + 1) }; },
        () => { const price = rnd(2, 9), n = rnd(3, 12); return { q: n + " cupcakes cost $" + price * n + " in total. How much does one cupcake cost?", a: price, unit: "dollars", hint: "Share the total cost by the number of cupcakes.", work: price * n + " ÷ " + n + " = " + price }; }
      ] },
    { id: "frac", title: "Fractions", sym: "½", level: "Starter", entry: "frac",
      blurb: "Parts of a whole, and fractions of amounts.",
      teach: [
        "A fraction is part of a whole. The bottom number (denominator) says how many equal pieces the whole is cut into. The top number (numerator) says how many pieces you have.",
        "To find a fraction of an amount, divide by the bottom and multiply by the top. ¾ of 20: 20 ÷ 4 = 5, then 5 × 3 = `15`.",
        "You can type fraction answers like 3/8."
      ],
      gens: [
        () => { const d = pick([6, 8, 10, 12]), n = rnd(1, d - 1), who = name(); return { q: "A pizza is cut into " + d + " equal slices. " + who + " eats " + n + ". What fraction of the pizza did " + who + " eat?", a: n / d, frac: n + "/" + d, hint: "Pieces eaten over total pieces.", work: n + " out of " + d + " slices is " + n + "/" + d }; },
        () => { const d = pick([2, 3, 4, 5]), n = rnd(1, d - 1), each = rnd(3, 12), total = d * each; return { q: "There are " + total + " sweets in a jar. " + n + "/" + d + " of them are red. How many red sweets are there?", a: n * each, unit: "sweets", hint: "Divide " + total + " by " + d + ", then multiply by " + n + ".", work: total + " ÷ " + d + " = " + each + ", then × " + n + " = " + n * each }; },
        () => { const d = pick([4, 5, 8, 10]), n = rnd(1, d - 1), who = name(); return { q: who + " has read " + n + "/" + d + " of a book. What fraction is left to read?", a: (d - n) / d, frac: (d - n) + "/" + d, hint: "The whole book is " + d + "/" + d + ". Take away what’s been read.", work: d + "/" + d + " − " + n + "/" + d + " = " + (d - n) + "/" + d }; },
        () => { const len = pick([12, 24, 36, 48, 60]), d = pick([2, 3, 4]); return { q: "A ribbon is " + len + " cm long. You cut off 1/" + d + " of it. How long is the piece you cut off?", a: len / d, unit: "cm", hint: "1/" + d + " of something means divide it by " + d + ".", work: len + " ÷ " + d + " = " + len / d }; }
      ] },
    { id: "pct", title: "Percentages", sym: "%", level: "Middle", entry: "pct",
      blurb: "Discounts, scores and ‘out of 100’.",
      teach: [
        "Percent means ‘out of 100’. 30% is 30 out of every 100, the same as 30/100 or 0.3.",
        "To find a percentage of something, divide by 100 to get 1%, then multiply. 15% of 60: 60 ÷ 100 = 0.6, then × 15 = `9`. Shortcut: 10% is dividing by 10, and 50% is half."
      ],
      gens: [
        () => { const p = pick([10, 20, 25, 50]), price = pick([40, 60, 80, 120, 200]); return { q: "A jacket costs $" + price + ". In a sale it is " + p + "% off. How much money do you save?", a: price * p / 100, unit: "dollars", hint: "Find " + p + "% of " + price + ".", work: price + " ÷ 100 × " + p + " = " + price * p / 100 }; },
        () => { const p = pick([10, 20, 25, 30]), price = pick([50, 80, 100, 150]); return { q: "A bike costs $" + price + " and is " + p + "% off. What is the sale price?", a: price - price * p / 100, unit: "dollars", hint: "Work out the discount, then subtract it from " + price + ".", work: p + "% of " + price + " = " + price * p / 100 + ", and " + price + " − " + price * p / 100 + " = " + (price - price * p / 100) }; },
        () => { const total = pick([20, 25, 40, 50]), got = rnd(Math.ceil(total / 2), total); return { q: name() + " got " + got + " out of " + total + " on a quiz. What percentage is that?", a: got / total * 100, unit: "%", tol: 0.05, hint: "Divide " + got + " by " + total + ", then multiply by 100.", work: got + " ÷ " + total + " × 100 = " + fmt(got / total * 100) + "%" }; },
        () => { const kids = pick([200, 300, 400, 500]), p = pick([15, 30, 45, 60]); return { q: "A school has " + kids + " pupils. " + p + "% of them walk to school. How many pupils walk?", a: kids * p / 100, unit: "pupils", hint: "1% of " + kids + " is " + kids / 100 + ".", work: kids / 100 + " × " + p + " = " + kids * p / 100 }; }
      ] },
    { id: "pow", title: "Powers and doubling", sym: "xⁿ", level: "Middle", entry: "pow",
      blurb: "Repeated multiplication and fast growth.",
      teach: [
        "A power is repeated multiplication. 2⁵ means 2 × 2 × 2 × 2 × 2 = `32`. The small number says how many 2s to multiply.",
        "Powers grow really fast. If something doubles every hour, after n hours you have 2ⁿ times as much. You can type powers as 2^5 in the calculator."
      ],
      gens: [
        () => { const n = rnd(4, 10); return { q: "A single bacterium splits into 2 every hour. How many bacteria are there after " + n + " hours?", a: Math.pow(2, n), unit: "bacteria", hint: "It doubles " + n + " times, so work out 2^" + n + ".", work: "2^" + n + " = " + Math.pow(2, n) }; },
        () => { const n = rnd(3, 6); return { q: name() + " tells a secret to 3 friends. Each friend tells 3 new people, and so on. How many new people hear it in round " + n + "?", a: Math.pow(3, n), unit: "people", hint: "Each round multiplies by 3. Round " + n + " is 3^" + n + ".", work: "3^" + n + " = " + Math.pow(3, n) }; },
        () => { const s = rnd(3, 12); return { q: "A square tile is " + s + " cm on each side. What is its area in cm²?", a: s * s, unit: "cm²", hint: "Area of a square is side².", work: s + "² = " + s + " × " + s + " = " + s * s }; },
        () => { const s = rnd(2, 9); return { q: "A cube-shaped box is " + s + " cm on each edge. What is its volume in cm³?", a: s * s * s, unit: "cm³", hint: "Volume of a cube is side³.", work: s + "³ = " + s + " × " + s + " × " + s + " = " + s * s * s }; }
      ] },
    { id: "sqrt", title: "Square roots", sym: "√", level: "Middle", entry: "sqrt",
      blurb: "Going backwards from a square.",
      teach: [
        "A square number is a number times itself. 6 × 6 = 36, so 36 is a square number, and we write 6² = 36.",
        "The square root goes backwards. √36 asks: what number times itself makes 36? The answer is `6`, because 6 × 6 = 36.",
        "If a number isn’t a perfect square, find the squares on each side. 50 is between 49 (7²) and 64 (8²), so √50 is a little more than 7, about 7.07."
      ],
      gens: [
        () => { const n = rnd(4, 15); return { q: name() + "’s square garden has an area of " + n * n + " m². How long is one side?", a: n, unit: "m", hint: "Which number times itself makes " + n * n + "?", work: "√" + n * n + " = " + n + " because " + n + " × " + n + " = " + n * n }; },
        () => { const n = rnd(5, 14); return { q: "A square floor is covered by " + n * n + " square tiles laid in a perfect square. How many tiles are along one edge?", a: n, unit: "tiles", hint: "The tiles make a square, so find √" + n * n + ".", work: "√" + n * n + " = " + n }; },
        () => { const m = rnd(3, 11), v = m * m + rnd(1, 2 * m); return { q: "√" + v + " is between two whole numbers. What is the smaller one?", a: m, hint: "Find the biggest square number that is less than " + v + ".", work: m + "² = " + m * m + " and " + (m + 1) + "² = " + (m + 1) * (m + 1) + ", so √" + v + " is between " + m + " and " + (m + 1) }; },
        () => { const n = rnd(3, 12); return { q: "A square picture frame has an area of " + n * n * 4 + " cm². How long is each side?", a: 2 * n, unit: "cm", hint: "Find the number that times itself makes " + n * n * 4 + ".", work: "√" + 4 * n * n + " = " + 2 * n }; },
        () => { const a = pick([2, 3, 5, 10]); return { q: "Estimate √" + a * 100 + " to 1 decimal place. (Hint: 100 is 10².)", a: r1(Math.sqrt(a * 100)), tol: 0.11, hint: "√" + a * 100 + " = √" + a + " × √100 = √" + a + " × 10.", work: "√" + a * 100 + " ≈ " + r2(Math.sqrt(a * 100)) }; }
      ] },
    { id: "pythag", title: "The Pythagorean theorem", sym: "a²+b²=c²", level: "Harder", entry: "pythag",
      blurb: "Ladders, diagonals and right triangles.",
      teach: [
        "A right triangle has one square corner (90°). The longest side, opposite the square corner, is called the hypotenuse.",
        "Pythagoras’ rule says: a² + b² = c², where a and b are the two short sides and c is the hypotenuse. If you draw a square on each side, the two small squares together have the same area as the big one.",
        "Example: sides 3 and 4. 3² + 4² = 9 + 16 = 25, and √25 = 5. So the long side is `5`.",
        "To find a short side instead, subtract: a² = c² − b²."
      ],
      gens: [
        () => { const [a, b, c] = pick(TRIPLES); return { q: "A ladder leans against a wall. Its foot is " + a + " m from the wall, and it reaches " + b + " m up the wall. How long is the ladder?", a: c, unit: "m", hint: "The ladder is the hypotenuse. Work out " + a + "² + " + b + "², then take the square root.", work: a + "² + " + b + "² = " + a * a + " + " + b * b + " = " + c * c + ", and √" + c * c + " = " + c }; },
        () => { const [a, b, c] = pick(TRIPLES), n = name(); return { q: n + " walks " + a + " km east and then " + b + " km north. How far is " + n + " from the start, in a straight line?", a: c, unit: "km", hint: "East and north make a right angle. The straight line back is the hypotenuse.", work: "√(" + a + "² + " + b + "²) = √" + c * c + " = " + c }; },
        () => { const [a, b, c] = pick(TRIPLES); return { q: "A TV screen is " + b + " inches wide and " + a + " inches tall. How long is its diagonal?", a: c, unit: "inches", hint: "The diagonal splits the screen into two right triangles.", work: "√(" + b + "² + " + a + "²) = √" + c * c + " = " + c }; },
        () => { const [a, b, c] = pick(TRIPLES); return { q: "A " + c + " m rope runs from the top of a flagpole to a peg in the ground " + a + " m from the pole. How tall is the flagpole?", a: b, unit: "m", hint: "The rope is the hypotenuse, so subtract: " + c + "² − " + a + "².", work: c + "² − " + a + "² = " + c * c + " − " + a * a + " = " + b * b + ", and √" + b * b + " = " + b }; },
        () => { const a = rnd(2, 9), b = rnd(2, 9); return { q: "A rectangular park is " + a + " km by " + b + " km. How long is the path from one corner straight across to the opposite corner? Round to 1 decimal place.", a: r1(Math.hypot(a, b)), tol: 0.06, unit: "km", hint: "Work out " + a + "² + " + b + "² and find its square root.", work: a + "² + " + b + "² = " + (a * a + b * b) + ", and √" + (a * a + b * b) + " ≈ " + r2(Math.hypot(a, b)) }; }
      ] },
    { id: "area", title: "Area and perimeter", sym: "▭", level: "Middle", entry: "area",
      blurb: "Fences, carpets and gardens.",
      teach: [
        "Perimeter is the distance all the way around a shape. For a rectangle: add all four sides, or 2 × (length + width).",
        "Area is how much space a shape covers, measured in squares. For a rectangle: length × width. A 5 m by 3 m room has an area of `15` m²."
      ],
      gens: [
        () => { const l = rnd(4, 15), w = rnd(3, 10); return { q: "A rectangular garden is " + l + " m long and " + w + " m wide. How much fence is needed to go all the way around?", a: 2 * (l + w), unit: "m", hint: "Fence goes around the edge: that’s perimeter.", work: "2 × (" + l + " + " + w + ") = " + 2 * (l + w) }; },
        () => { const l = rnd(3, 9), w = rnd(2, 7); return { q: "A bedroom floor is " + l + " m by " + w + " m. How many square metres of carpet are needed?", a: l * w, unit: "m²", hint: "Carpet covers the floor: that’s area.", work: l + " × " + w + " = " + l * w }; },
        () => { const s = rnd(3, 20); return { q: "A square playground has a perimeter of " + 4 * s + " m. How long is each side?", a: s, unit: "m", hint: "A square has 4 equal sides.", work: 4 * s + " ÷ 4 = " + s }; },
        () => { const w = rnd(2, 8), l = rnd(3, 12); return { q: "A rectangle has an area of " + l * w + " cm² and a width of " + w + " cm. How long is it?", a: l, unit: "cm", hint: "Length × width = area, so length = area ÷ width.", work: l * w + " ÷ " + w + " = " + l }; }
      ] },
    { id: "circle", title: "Circles and π", sym: "π", level: "Harder", entry: "circle",
      blurb: "Wheels, ponds and pizzas.",
      teach: [
        "The radius r goes from the centre of a circle to its edge. The diameter goes all the way across, so it is 2r.",
        "The distance around a circle (its circumference) is 2 × π × r. π ≈ 3.14.",
        "The area of a circle is π × r². A pizza with radius 10 cm has area π × 100 ≈ `314` cm². Round your answers to 1 decimal place."
      ],
      gens: [
        () => { const r = rnd(2, 12); return { q: "A round pond has a radius of " + r + " m. How far is it around the edge? Round to 1 decimal place.", a: r1(2 * Math.PI * r), tol: 0.11, unit: "m", hint: "Circumference = 2 × π × radius.", work: "2 × π × " + r + " ≈ " + r2(2 * Math.PI * r) }; },
        () => { const r = rnd(3, 15); return { q: "A pizza has a radius of " + r + " cm. What is its area? Round to 1 decimal place.", a: r1(Math.PI * r * r), tol: 0.11, unit: "cm²", hint: "Area = π × r². First work out " + r + "².", work: "π × " + r + "² = π × " + r * r + " ≈ " + r2(Math.PI * r * r) }; },
        () => { const d = rnd(4, 20) * 2; return { q: "A bike wheel has a diameter of " + d + " cm. How far does the bike travel in one full turn of the wheel? Round to 1 decimal place.", a: r1(Math.PI * d), tol: 0.11, unit: "cm", hint: "One turn rolls out the circumference: π × diameter.", work: "π × " + d + " ≈ " + r2(Math.PI * d) }; },
        () => { const r = rnd(2, 9); return { q: "A circle has a radius of " + r + " cm. What is its diameter?", a: 2 * r, unit: "cm", hint: "The diameter is two radiuses end to end.", work: "2 × " + r + " = " + 2 * r }; }
      ] },
    { id: "ratio", title: "Ratios", sym: "a : b", level: "Middle", entry: "ratio",
      blurb: "Recipes, mixing and sharing fairly.",
      teach: [
        "A ratio compares amounts. Juice mixed 1 : 4 means 1 part syrup for every 4 parts water.",
        "To share in a ratio, add the parts, divide to find one part, then multiply. Share $30 in the ratio 2 : 3. There are 2 + 3 = 5 parts, so one part is $6. The shares are 2 × 6 = $12 and 3 × 6 = `$18`."
      ],
      gens: [
        () => { const k = rnd(3, 6), s = rnd(2, 6); return { q: "Squash is mixed 1 part syrup to " + k + " parts water. How many cups of water go with " + s + " cups of syrup?", a: k * s, unit: "cups", hint: "Each cup of syrup needs " + k + " cups of water.", work: s + " × " + k + " = " + k * s }; },
        () => { const a = rnd(1, 4), b = rnd(2, 5), part = rnd(3, 12), n1 = name(), n2 = name(); return { q: n1 + " and " + (n2 === n1 ? "Jo" : n2) + " share $" + (a + b) * part + " in the ratio " + a + " : " + b + ". How much does " + n1 + " get?", a: a * part, unit: "dollars", hint: "There are " + (a + b) + " parts altogether. Find one part first.", work: (a + b) * part + " ÷ " + (a + b) + " = " + part + ", and " + a + " × " + part + " = " + a * part }; },
        () => { const eggs = rnd(2, 4), people = 4, want = pick([8, 12, 16]); return { q: "A pancake recipe for " + people + " people uses " + eggs + " eggs. How many eggs do you need for " + want + " people?", a: eggs * want / people, unit: "eggs", hint: want + " people is " + want / people + " times as many as " + people + ".", work: eggs + " × " + want / people + " = " + eggs * want / people }; },
        () => { const b = rnd(2, 5), g = rnd(2, 5), m = rnd(3, 6); return { q: "In a class the ratio of boys to girls is " + b + " : " + g + ". There are " + g * m + " girls. How many boys are there?", a: b * m, unit: "boys", hint: "Find how many pupils one part is: " + g * m + " ÷ " + g + ".", work: g * m + " ÷ " + g + " = " + m + ", and " + b + " × " + m + " = " + b * m }; }
      ] },
    { id: "mean", title: "Averages", sym: "x̄", level: "Middle", entry: "mean",
      blurb: "Mean scores, temperatures and more.",
      teach: [
        "The mean (the usual ‘average’) shares the total out equally. Add everything up, then divide by how many there are.",
        "Scores 4, 7 and 10: the total is 21, and there are 3 scores, so the mean is 21 ÷ 3 = `7`."
      ],
      gens: [
        () => { const k = rnd(3, 5), m = rnd(5, 20), vals = Array.from({ length: k }, () => m); for (let i = 0; i < k - 1; i++) { const d = rnd(-4, 4); vals[i] += d; vals[k - 1] -= d; } return { q: name() + " scored " + vals.join(", ") + " in " + k + " games. What is the mean score?", a: m, unit: "points", hint: "Add the scores, then divide by " + k + ".", work: vals.join(" + ") + " = " + m * k + ", and " + m * k + " ÷ " + k + " = " + m }; },
        () => { const t = [rnd(12, 20), rnd(12, 20), rnd(12, 20), rnd(12, 20)], s = t.reduce((a, b) => a + b, 0); return { q: "The temperature at noon on four days was " + t.join("°C, ") + "°C. What was the mean temperature? Round to 1 decimal place if you need to.", a: r1(s / 4), tol: 0.06, unit: "°C", hint: "Total of all four, divided by 4.", work: t.join(" + ") + " = " + s + ", and " + s + " ÷ 4 = " + fmt(s / 4) }; },
        () => { const n = rnd(3, 6), m = rnd(6, 15); return { q: n + " friends collected a mean of " + m + " shells each. How many shells did they collect in total?", a: n * m, unit: "shells", hint: "Mean × how many = total.", work: n + " × " + m + " = " + n * m }; }
      ] },
    { id: "neg", title: "Negative numbers", sym: "−3", level: "Middle", entry: "neg",
      blurb: "Below zero: temperatures, depths and debts.",
      teach: [
        "Negative numbers are less than zero, like −5°C on a freezing night. On a number line they sit to the left of 0.",
        "Adding moves you right and subtracting moves you left. −3 + 8: start at −3 and move 8 to the right to land on `5`."
      ],
      gens: [
        () => { const a = rnd(2, 9), b = rnd(a + 1, a + 12); return { q: "At night the temperature is −" + a + "°C. By noon it has risen " + b + " degrees. What is the temperature at noon?", a: b - a, unit: "°C", hint: "Start at −" + a + " and count " + b + " to the right.", work: "−" + a + " + " + b + " = " + (b - a) }; },
        () => { const d = rnd(20, 80), u = rnd(5, d - 5); return { q: "A submarine is at −" + d + " m. It rises " + u + " m. What is its new depth? (Use a minus sign.)", a: -(d - u), unit: "m", hint: "Rising means adding: −" + d + " + " + u + ".", work: "−" + d + " + " + u + " = −" + (d - u) }; },
        () => { const a = rnd(1, 8), b = rnd(2, 9); return { q: "It is " + a + "°C and the temperature drops by " + (a + b) + " degrees. What is the temperature now?", a: -b, unit: "°C", hint: "Dropping means subtract: " + a + " − " + (a + b) + ".", work: a + " − " + (a + b) + " = −" + b }; },
        () => { const a = rnd(3, 12), b = rnd(2, 10); return { q: "The top of a hill is " + a * 10 + " m above sea level and the bottom of a lake is −" + b * 10 + " m. How far apart are they in height?", a: a * 10 + b * 10, unit: "m", hint: "Distance from −" + b * 10 + " up to 0, then up to " + a * 10 + ".", work: a * 10 + " − (−" + b * 10 + ") = " + (a * 10 + b * 10) }; }
      ] },
    { id: "equation", title: "Solving equations", sym: "x = ?", level: "Harder", entry: "equation",
      blurb: "Mystery numbers and balancing.",
      teach: [
        "An equation is like a balance: both sides weigh the same. A letter like x stands for a mystery number.",
        "To find x, undo what was done to it, doing the same to both sides. 3x + 2 = 14. Take 2 from both sides: 3x = 12. Divide both sides by 3: x = `4`."
      ],
      gens: [
        () => { const x = rnd(2, 12), a = rnd(2, 6), b = rnd(1, 15); return { q: "I think of a number, multiply it by " + a + " and add " + b + ". I get " + (a * x + b) + ". What is my number?", a: x, hint: "Undo it backwards: take away " + b + ", then divide by " + a + ".", work: (a * x + b) + " − " + b + " = " + a * x + ", and " + a * x + " ÷ " + a + " = " + x }; },
        () => { const x = rnd(3, 15), p = rnd(2, 6), f = rnd(2, 9); return { q: "A taxi charges $" + f + " to start plus $" + p + " for each km. A ride costs $" + (f + p * x) + ". How many km was it?", a: x, unit: "km", hint: "Write it as " + f + " + " + p + "x = " + (f + p * x) + ".", work: (f + p * x) + " − " + f + " = " + p * x + ", and " + p * x + " ÷ " + p + " = " + x }; },
        () => { const x = rnd(4, 20), n = name(); return { q: n + " is 3 times as old as their cousin. Together their ages add up to " + 4 * x + ". How old is the cousin?", a: x, unit: "years", hint: "If the cousin is x, " + n + " is 3x, so x + 3x = " + 4 * x + ".", work: "4x = " + 4 * x + ", so x = " + x }; },
        () => { const x = rnd(5, 30), a = rnd(3, 20); return { q: "A box has some pens in it. After " + a + " more pens are added there are " + (x + a) + ". How many pens were in the box at first?", a: x, unit: "pens", hint: "Call the first amount x: x + " + a + " = " + (x + a) + ".", work: (x + a) + " − " + a + " = " + x }; }
      ] },
    { id: "speed", title: "Speed, distance and time", sym: "d = s × t", level: "Harder", entry: "ratio",
      blurb: "Trains, bikes and journeys.",
      teach: [
        "Speed tells you how far you go in a certain time. 60 km/h means 60 km every hour.",
        "Distance = speed × time. Speed = distance ÷ time. Time = distance ÷ speed. A car at 50 km/h for 3 hours goes 50 × 3 = `150` km."
      ],
      gens: [
        () => { const s = rnd(4, 20) * 5, t = rnd(2, 5); return { q: "A train travels at " + s + " km/h for " + t + " hours. How far does it go?", a: s * t, unit: "km", hint: "Distance = speed × time.", work: s + " × " + t + " = " + s * t }; },
        () => { const s = rnd(8, 25), t = rnd(2, 6); return { q: name() + " cycles " + s * t + " km in " + t + " hours. What is the average speed in km/h?", a: s, unit: "km/h", hint: "Speed = distance ÷ time.", work: s * t + " ÷ " + t + " = " + s }; },
        () => { const s = pick([40, 50, 60, 80]), t = rnd(2, 6); return { q: "A car drives " + s * t + " km at " + s + " km/h. How many hours does the trip take?", a: t, unit: "hours", hint: "Time = distance ÷ speed.", work: s * t + " ÷ " + s + " = " + t }; },
        () => { const s = pick([3, 4, 5, 6]), mins = pick([30, 90, 120]); return { q: "You walk at " + s + " km/h for " + mins + " minutes. How far do you walk?", a: s * mins / 60, unit: "km", hint: mins + " minutes is " + fmt(mins / 60) + " hours.", work: s + " × " + fmt(mins / 60) + " = " + fmt(s * mins / 60) }; }
      ] }
  ];
  const QUESTIONS_PER_LESSON = 5;
  const PRAISE = ["Yes! That’s right.", "Spot on!", "Correct, nice work!", "You got it!", "Brilliant, that’s right.", "Exactly right!"];

  const store = {
    get(id) { try { return JSON.parse(localStorage.getItem("mathbook-lesson-" + id) || "null"); } catch (e) { return null; } },
    set(id, v) { try { localStorage.setItem("mathbook-lesson-" + id, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------------- Claude (optional) ---------------- */
  let samplePromise = null;
  const getSample = () => {
    if (!samplePromise) samplePromise = (window.claude && window.claude.use) ? window.claude.use("sample").catch(() => null) : Promise.resolve(null);
    return samplePromise;
  };
  let claudeOff = false;

  /* ---------------- Lessons list ---------------- */
  function renderList(view) {
    const levels = ["Starter", "Middle", "Harder"];
    view.append(
      h("header", { class: "page-head" },
        h("p", { class: "eyebrow" }, LESSONS.length + " lessons with Pip the tutor"),
        h("h1", null, "Lessons"),
        h("p", { class: "lede" }, "Pick a topic. Pip explains it step by step in a chat, then gives you word problems to solve. Type your answer in the box, and ask for a hint whenever you’re stuck.")),
      ...levels.map(lv => h("section", { class: "lesson-group" },
        h("h2", { class: "h-small" }, lv),
        h("div", { class: "lesson-cards" }, LESSONS.filter(l => l.level === lv).map(l => {
          const best = store.get(l.id);
          return h("a", { class: "lesson-card", href: "#lesson-" + l.id },
            h("span", { class: "lc-sym" }, l.sym),
            h("span", { class: "lc-body" }, h("b", null, l.title), h("span", null, l.blurb)),
            h("span", { class: "lc-score" + (best ? " done" : "") }, best ? "Best " + best.best + "/" + QUESTIONS_PER_LESSON : "Start"));
        })))));
  }

  /* ---------------- One lesson: the chat ---------------- */
  function renderLesson(view, id) {
    const L = LESSONS.find(l => l.id === id);
    if (!L) { location.hash = "lessons"; return; }
    const idx = LESSONS.indexOf(L);
    const S = { phase: "teach", ti: 0, qi: 0, q: null, tries: 0, score: 0, turns: [], busy: false, order: [] };

    const log = h("div", { class: "chat-log", role: "log", "aria-live": "polite", "aria-label": "Chat with Pip" });
    const chips = h("div", { class: "chat-chips" });
    const input = h("input", { id: "chat-input", class: "chat-input", autocomplete: "off", placeholder: "Type your answer or a question…", "aria-label": "Your message" });
    const send = h("button", { class: "btn btn-accent", type: "submit" }, "Send");
    const form = h("form", { class: "chat-form", onsubmit: e => { e.preventDefault(); const t = input.value.trim(); if (!t || S.busy) return; input.value = ""; userSays(t); } }, input, send);
    const dots = h("div", { class: "chat-progress", "aria-label": "Progress" });
    const status = h("p", { class: "chat-status" });

    const drawDots = () => {
      dots.innerHTML = "";
      for (let i = 0; i < QUESTIONS_PER_LESSON; i++) {
        const st = S.results && S.results[i];
        dots.append(h("span", { class: "pd" + (st === true ? " ok" : st === false ? " miss" : "") + (S.phase === "quiz" && i === S.qi ? " now" : ""), title: "Question " + (i + 1) }));
      }
    };
    S.results = [];

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollDown = () => { log.scrollTop = log.scrollHeight; };

    // Turn `code` into highlighted spans.
    const rich = text => {
      const p = h("p");
      text.split("`").forEach((part, i) => p.append(i % 2 ? h("code", null, part) : document.createTextNode(part)));
      return p;
    };
    function bubble(who, text) {
      const b = h("div", { class: "msg " + who },
        who === "bot" ? h("span", { class: "avatar", "aria-hidden": "true" }, "π") : null,
        h("div", { class: "msg-body" }, text != null ? rich(text) : null));
      log.append(b);
      scrollDown();
      return b;
    }
    let queue = Promise.resolve();
    function say(text, opts) {
      queue = queue.then(() => new Promise(res => {
        const typing = h("div", { class: "msg bot typing" }, h("span", { class: "avatar", "aria-hidden": "true" }, "π"), h("div", { class: "msg-body" }, h("i"), h("i"), h("i")));
        log.append(typing); scrollDown();
        setTimeout(() => {
          typing.remove();
          bubble("bot", text);
          S.turns.push({ role: "assistant", content: text.replace(/`/g, "") });
          if (opts && opts.chips) setChips(opts.chips);
          res();
        }, reduce ? 50 : Math.min(1100, 350 + text.length * 6));
      }));
      return queue;
    }
    function setChips(list) {
      chips.innerHTML = "";
      list.forEach(([label, fn]) => chips.append(h("button", { class: "chip-btn", type: "button", onclick: () => { if (S.busy) return; bubble("me", label); S.turns.push({ role: "user", content: label }); setChips([]); fn(); } }, label)));
    }

    // Flow
    function start() {
      S.phase = "teach"; S.ti = 0; S.qi = 0; S.score = 0; S.results = [];
      S.order = Array.from({ length: QUESTIONS_PER_LESSON }, (_, i) => L.gens[i % L.gens.length]).sort(() => Math.random() - 0.5);
      drawDots();
      say("Hi! I’m Pip. Today we’re learning about " + L.title.toLowerCase() + ".");
      teach();
    }
    function teach() {
      if (S.ti >= L.teach.length) return ready();
      const last = S.ti === L.teach.length - 1;
      say(L.teach[S.ti], { chips: [[last ? "Got it" : "Next", () => { S.ti++; teach(); }], ["Skip to questions", ready]] });
    }
    function ready() {
      S.phase = "ready";
      say("Now let’s try " + QUESTIONS_PER_LESSON + " word problems. Type your answer in the box below. Just the number is fine.", { chips: [["Let’s go!", ask]] });
    }
    const QCHIPS = () => [["Hint", hint], ["Show me how", showMe], ["Skip", skip]];
    function ask() {
      S.phase = "quiz"; S.tries = 0;
      S.q = S.order[S.qi]();
      drawDots();
      say("Question " + (S.qi + 1) + " of " + QUESTIONS_PER_LESSON + ": " + S.q.q, { chips: QCHIPS() });
      setTimeout(() => { if (matchMedia("(pointer:fine)").matches) input.focus(); }, 50);
    }
    const answerText = () => S.q.frac ? S.q.frac : fmt(S.q.a) + (S.q.unit && S.q.unit !== "%" ? " " + S.q.unit : S.q.unit === "%" ? "%" : "");
    function hint() { say("Hint: " + S.q.hint, { chips: [["Show me how", showMe], ["Skip", skip]] }); }
    function showMe() {
      S.results[S.qi] = S.results[S.qi] ?? false;
      say("Here’s how: `" + S.q.work + "`. The answer is " + answerText() + ".");
      nextQ();
    }
    function skip() { S.results[S.qi] = false; say("No problem. The answer was " + answerText() + "."); nextQ(); }
    function nextQ() {
      S.qi++;
      drawDots();
      if (S.qi >= QUESTIONS_PER_LESSON) return finish();
      ask();
    }
    function finish() {
      S.phase = "done";
      drawDots();
      const prev = store.get(L.id);
      store.set(L.id, { best: Math.max(S.score, prev ? prev.best : 0) });
      const msg = S.score === QUESTIONS_PER_LESSON ? "Wow, " + S.score + " out of " + QUESTIONS_PER_LESSON + " first time! You’ve mastered this."
        : S.score >= 3 ? "Well done! You got " + S.score + " out of " + QUESTIONS_PER_LESSON + " right first time."
        : "You got " + S.score + " out of " + QUESTIONS_PER_LESSON + " first time. Practice makes perfect, so try another round!";
      const next = LESSONS[idx + 1];
      say(msg, { chips: [["Practice again", () => { log.innerHTML = ""; S.turns = []; start(); }]].concat(next ? [["Next lesson: " + next.title, () => { location.hash = "lesson-" + next.id; }]] : []).concat([["All lessons", () => { location.hash = "lessons"; }]]) });
    }

    function parseAnswer(t) {
      let s = t.toLowerCase().replace(/[−–]/g, "-").replace(/minus\s*/g, "-").replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/[$£€%°]/g, " ");
      const m = s.match(/-?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?/);
      if (!m) return null;
      const txt = m[0].replace(/\s+/g, "");
      if (txt.includes("/")) { const [a, b] = txt.split("/").map(Number); return b ? a / b : null; }
      return Number(txt);
    }
    const looksLikeAnswer = t => /\d/.test(t) && t.length <= 40 && !/\?/.test(t) && !/^(why|how|what|can|could|is|does|do|where|when|explain)\b/i.test(t.trim());

    function check(t) {
      const v = parseAnswer(t);
      if (v == null || isNaN(v)) return false;
      const tol = S.q.tol != null ? S.q.tol : 1e-6 * Math.max(1, Math.abs(S.q.a));
      if (Math.abs(v - S.q.a) <= tol) {
        if (S.tries === 0) { S.score++; S.results[S.qi] = true; } else S.results[S.qi] = S.results[S.qi] ?? false;
        say(pick(PRAISE) + " `" + S.q.work + "`.");
        nextQ();
      } else {
        S.tries++;
        if (S.tries === 1) say("Not quite. " + S.q.hint + " Have another go!", { chips: QCHIPS() });
        else if (S.tries === 2) say("Close, but not yet. Check your working: is it " + (v > S.q.a ? "a bit big" : "a bit small") + "? One more try.", { chips: [["Show me how", showMe], ["Skip", skip]] });
        else { S.results[S.qi] = false; say("Let’s look at it together: `" + S.q.work + "`. So the answer is " + answerText() + "."); nextQ(); }
      }
      return true;
    }

    function fallbackReply(t) {
      const low = t.toLowerCase();
      if (S.phase === "quiz") {
        if (/hint|help|stuck|don.?t know|idk|no idea/.test(low)) return hint();
        if (/show|answer|give up|how/.test(low)) return showMe();
        if (/skip|next/.test(low)) return skip();
        return say("Good question! Here’s a clue: " + S.q.hint + " When you have a number, type it in the box.", { chips: QCHIPS() });
      }
      if (S.phase === "teach") {
        if (/skip|question|ready|go/.test(low)) return ready();
        if (/next|ok|yes|got|sure|cool|continue/.test(low)) { S.ti++; return teach(); }
        return say("Good question! Keep going and the next part might help. Tap Next when you’re ready.", { chips: [["Next", () => { S.ti++; teach(); }], ["Skip to questions", ready]] });
      }
      if (S.phase === "ready") return ask();
      return say("Tap Practice again for new questions, or pick the next lesson.");
    }

    async function askClaude(t) {
      const sample = claudeOff ? null : await getSample();
      if (!sample) return fallbackReply(t);
      S.busy = true; send.disabled = true;
      const b = bubble("bot", null);
      const body = b.querySelector(".msg-body");
      body.append(h("p", { class: "thinking" }, "Thinking…"));
      const situation = S.phase === "quiz"
        ? "The student is working on this word problem: \"" + S.q.q + "\". The correct answer is " + answerText() + " (working: " + S.q.work + "). They have had " + S.tries + " wrong tries."
        : S.phase === "teach" ? "You are explaining this step of the lesson: \"" + L.teach[Math.min(S.ti, L.teach.length - 1)].replace(/`/g, "") + "\""
        : "The lesson is finished; the student scored " + S.score + " out of " + QUESTIONS_PER_LESSON + ".";
      const rules = "You are Pip, a cheerful, patient math tutor in a kids’ math website called The Math Book. The lesson is \"" + L.title + "\". " + situation +
        " Reply to the student’s latest message in at most 3 short sentences of plain text: no markdown, no LaTeX, use symbols like × ÷ √ ². Never state the final answer to the current word problem; give a hint or ask a guiding question instead. If they ask about something unrelated to math, kindly steer back to the lesson.";
      const history = S.turns.slice(-8);
      const turns = [{ role: "user", content: rules }].concat(history);
      if (!turns.length || turns[turns.length - 1].role !== "user") turns.push({ role: "user", content: t });
      try {
        const { text } = await sample(turns, { modelTier: "quick", cache: false, onText: ({ text }) => { body.innerHTML = ""; body.append(rich(text)); scrollDown(); } });
        S.turns.push({ role: "assistant", content: text });
        if (S.phase === "quiz") setChips(QCHIPS());
        else if (S.phase === "teach") setChips([["Next", () => { S.ti++; teach(); }], ["Skip to questions", ready]]);
      } catch (e) {
        b.remove();
        if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(e.code)) { claudeOff = true; status.textContent = ""; }
        fallbackReply(t);
      } finally {
        S.busy = false; send.disabled = false;
      }
    }

    function userSays(t) {
      bubble("me", t);
      S.turns.push({ role: "user", content: t });
      setChips([]);
      const low = t.toLowerCase().trim();
      if (S.phase === "quiz") {
        if (/^(hint|help)\b/.test(low)) return hint();
        if (/^(skip|next)\b/.test(low)) return skip();
        if (/^(show|show me|show me how|answer)\b/.test(low)) return showMe();
        if (looksLikeAnswer(t) && check(t)) return;
      } else if (S.phase === "ready" && /^(yes|go|ok|ready|let)/.test(low)) return ask();
      else if (S.phase === "teach" && /^(next|ok|okay|got it|yes|continue)\b/.test(low)) { S.ti++; return teach(); }
      askClaude(t);
    }

    const entry = M.BY_ID[L.entry];
    view.append(
      h("nav", { class: "trail", "aria-label": "Where you are" }, h("a", { href: "#lessons" }, "Lessons"), h("span", null, "›"), h("span", null, L.title)),
      h("section", { class: "chat-card" },
        h("header", { class: "chat-head" },
          h("span", { class: "chat-sym" }, L.sym),
          h("div", { class: "chat-title" }, h("h1", null, L.title), h("p", { class: "muted" }, "with Pip the tutor · " + L.level)),
          dots),
        log, chips, form, status),
      h("p", { class: "muted lesson-links" }, "Want the details? ", entry ? h("a", { href: "#entry-" + hid(entry.id) }, "Read about " + entry.name + " in the Math Index") : null,
        M.METHODS[L.entry] ? [" or ", h("a", { href: "#methods-" + hid(L.entry) }, "see the method")] : null, "."));
    getSample().then(s => { if (s && !claudeOff) status.textContent = "Pip can answer your questions too: type anything that isn’t an answer."; });
    start();
  }

  window.Lessons = { renderList, renderLesson, LESSONS };
})();
