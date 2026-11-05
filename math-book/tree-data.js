/* The Math Tree outline. One line per box; two spaces of indent = one level down.
 *   «sym» Label {entry_id} [code] — short description
 * Every part except Label is optional. A box with no {id} is linked by name when
 * the Math Book has a matching entry. "@group key" adds every entry of that group.
 */
window.MATH_TREE_OUTLINE = String.raw`
Addition {add} [+]
  Subtraction {sub} [<o+>]
    Negation {negation}
      Absolute value {abs}
      Negative numbers {neg}
      Number line {number_line}
      Signed zero {plusminus_zero}
    Difference {delta} [<s−>]
      Forward difference {forward_diff}
        Backward difference {backward_diff}
        Shift operator {shift_op}
      Slope {slope}
      «Δ» Change — How much something went up or down.
    «−» Borrowing — Taking 1 from the next column when you subtract.
    «a − b» Minuend and subtrahend — The number you start with, and the number you take away.
    «−» Minus has two jobs {fact_minus_two_meanings}
  Multiplication {mul} [<r+>]
    Exponentiation {pow} [<r<r+>>]
      Squaring {sq}
        Square root {sqrt}
          Square root of −1 {sqrt_neg}
          Schizophrenic numbers {schizophrenic}
        Square numbers {square_nums}
          Sums of odd numbers {fact_squares_odd}
          Odd squares {fact_odd_square}
        «n²» Perfect squares — Numbers like 1, 4, 9, 16 made by squaring whole numbers.
        «x²» Area of a square — Side × side.
      Cubing {cube}
        Cube root {cbrt}
        Cube numbers {cube_nums}
          Taxicab number 1729 {taxicab}
          Sums of three cubes {sum_of_cubes}
        «x³» Volume of a cube — Side × side × side.
      Nth roots {nroot} [<o<r<r+>>>]
      Logarithms {log}
        Natural log {ln}
        «log₂» Binary logarithm — How many times you halve a number to reach 1.
        Log scales {log_scale}
        Slide rule {slide_rule}
        Benford's law {benford}
      Tetration {tetration} [<r<r<r+>>>]
        Pentation {pentation}
          Hyperoperations {hyperoperation}
        Knuth's up-arrows {uparrow}
        «ⁿ√ₛ» Super-root — Undoes tetration: which x has xˣ = 27? x = 3.
      Exponential function {exponential} [<s<r<r+>>>]
        Euler's number {euler}
          e is irrational {fact_e_irrational}
        Compound interest {money_math}
        «2ⁿ» Exponential growth — Doubling again and again.
        «½ⁿ» Exponential decay — Halving again and again, like radioactive half-lives.
      Exponential factorial {exp_factorial} [<O<r<r+>>>]
      Exponent rules {fact_exp_rules}
      Negative exponents {fact_neg_exp}
      Fractional exponents {fact_frac_exp}
      Power of zero {fact_power_zero}
      Scientific notation {sci}
      Perfect powers {perfect_power}
      Powers of 2 — 1, 2, 4, 8, 16, 32, 64, … The numbers computers love.
      Powers of 10 — 10, 100, 1000, … Each is a 1 followed by zeros.
    Factorial {fact} [<O<r+>>]
      Superfactorial {superfactorial} [<O<O<r+>>>]
      Gamma function {gamma} [<s<O<r+>>>]
        Beta function {beta_fn}
        Digamma function {digamma}
      Double factorial {double_factorial}
      Zero factorial {fact_zero_fact}
      Combinations {choose}
        Pascal's triangle {pascal}
          Sierpiński triangle {sierpinski}
        Binomial theorem {binomial}
        Catalan numbers {catalan}
        Handshakes {fact_handshakes}
      Permutations {perm}
      «n!≈» Stirling's approximation — n! is about √(2πn)·(n/e)ⁿ.
      Primorial {primorial}
      Wilson's theorem {wilson}
      Brocard's problem {brocard}
    Division {div} [<o<r+>>]
      Fractions {frac}
        «¾» Proper fraction — The top is smaller than the bottom, like 3/4.
        «⁷⁄₄» Improper fraction — The top is bigger than the bottom, like 7/4.
          «1¾» Mixed fraction — A whole number and a fraction together, like 1¾.
        «½=²⁄₄» Equivalent fractions — 1/2 = 2/4 = 3/6: same amount, different numbers.
        «⁶⁄₈→¾» Simplifying fractions — Divide the top and bottom by their gcd.
        «a/» Numerator — The top number of a fraction.
        «/b» Denominator — The bottom number of a fraction.
        «⅟» Unit fractions — Fractions with 1 on top, like ⅓.
          Egyptian fractions {egyptian}
            Erdős–Straus conjecture {erdos_straus}
        Reciprocal {reciprocal}
          Dividing by a fraction {fact_div_fraction}
        Decimals {decimal}
          Repeating decimals {bar}
            0.999… = 1 {fact_point_nine}
          Decimal point {decpoint}
          Rounding {round}
          Significant figures {rounding_sig}
          Decimal comma {fact_decimal_comma}
        Percentages {pct}
          Per mille {permille}
            Per ten thousand {permyriad}
          «Δ%» Percent change — (new − old) ÷ old × 100.
          Swapping percentages {fact_percent_swap}
          Potato paradox {potato}
        Continued fractions {contfrac}
        Farey sequence {farey}
        Fraction bar {slash}
      «r» Remainders — What is left over after dividing.
        Modular arithmetic {mod}
          Congruence {congruence}
          Clock arithmetic {time_math}
          Chinese remainder theorem {crt}
          Fermat's little theorem {fermat_little}
          Quadratic residues {quad_res}
            Legendre symbol {legendre}
            Quadratic reciprocity {quad_recip}
          Primitive roots {primitive_root}
        «n» Modulus — The number you divide by in mod arithmetic.
        Digital root {digital_root}
      «÷» Long division — Divide one digit at a time from the left.
      Can't divide by zero {fact_div_zero}
      Zero divided by a number {fact_zero_div}
      Divisibility {divisibility}
        Divisibility by 3 and 9 {fact_div3}
        Divisibility by 2, 4 and 8 {fact_div4}
        Divisibility by 5 and 10 {fact_div5}
        Divisibility by 11 {fact_div11}
        Does not divide {notdivides}
        Harshad numbers {harshad}
      Ratios {ratio}
        Proportion {proportion}
          Proportional to {propto}
        «km/h» Rates — Ratios with units, like kilometres per hour.
          «d/t» Speed — Distance ÷ time.
          Average speed trap {fact_average_trap}
        «1:100» Scale drawings — Maps and models where 1 cm can stand for 1 km.
        Golden ratio {phi}
          Golden rectangle {golden_rect}
          Golden spiral {golden_spiral}
        Ratio colon {ratiosym}
      Repeated division {log} [<r÷>]
    «a × b» Factors — Numbers that multiply together to make a number.
      Prime numbers {prime}
        Composite numbers {composite}
        Prime factorization {fta}
        Infinitely many primes {infinite_primes}
        One is not prime {fact_one_prime}
        Two is the only even prime {fact_two_prime}
        Primes are 6k ± 1 {fact_prime_6k}
        Sieve of Eratosthenes {sieve}
        Twin primes {twin_prime}
        Mersenne primes {mersenne}
          Largest known prime {fact_largest_prime}
          Euclid–Euler theorem {euclid_euler}
        Sophie Germain primes {sophie_germain}
        Fermat numbers {fermat_numbers}
        Wieferich primes {wieferich}
        Emirps {emirp}
        Gaussian integers {gaussian_int}
        Prime gaps {prime_gap}
          Bertrand's postulate {bertrand_post}
          Legendre's conjecture {legendre_conj}
        Prime-counting function {prime_count}
          Prime number theorem {pnt}
          Logarithmic integral {li}
        Goldbach conjecture {goldbach}
        Riemann hypothesis {riemann_hyp}
        Ulam spiral {ulam}
        Dirichlet's theorem {dirichlet_ap}
        Semiprimes {semiprime}
          RSA cryptography {crypto}
        Pseudoprimes {pseudoprime}
          Carmichael numbers {carmichael}
          Miller–Rabin test {miller_rabin}
        Set of primes {primes_set}
      Greatest common factor {gcd}
        Euclidean algorithm {euclid_alg}
        Coprime numbers {coprime}
        Bézout's identity {bezout}
        Euler's totient {totient}
          Euler's theorem {euler_thm}
      «3, 6, 9» Multiples — The answers in a times table: 3, 6, 9, 12, …
        Lowest common multiple {lcm}
      Perfect numbers {perfect}
        Abundant numbers {abundant}
        Deficient numbers {deficient}
        Amicable numbers {amicable}
        Sociable numbers {sociable}
        Aliquot sequences {aliquot}
        Untouchable numbers {untouchable}
      Divisor functions {divisor_fn}
      Highly composite numbers {highly_composite}
      Practical numbers {practical}
      Smith numbers {smith}
      Möbius function {mobius_fn}
      Liouville function {liouville_fn}
    «12×12» Times tables — The multiplication facts from 1 × 1 up to 12 × 12.
      Nines trick {fact_nine_trick}
      Anything times zero {fact_times_zero}
      Anything times one {fact_times_one}
      Times ten {fact_times10}
    Many ways to write × {fact_mult_symbols}
    Multiplication dot {dot}
    Negative × negative {fact_neg_neg}
    Swapping the order {fact_commutative}
    «a(b+c)» Distributive law — a(b + c) = ab + ac.
    «(ab)c» Associative law — (ab)c = a(bc): grouping doesn't matter.
    «×» Long multiplication — Multiply by each digit, then add the rows.
    «▦» Lattice multiplication — A grid method used in the Middle Ages.
    Matrix multiplication {matmul}
    Cross product {crossprod}
    Tensor product {tensorprod}
    Area {area}
  Summation {sigma} [<s+>]
    Product of {prodsym} [<s<r+>>]
      Product operator {prod_op}
    Integral {integral} [<s<s+>>]
      Double integral {double_int} [<r∫>]
        Triple integral {triple_int}
        Surface integral {surface_int}
      Contour integral {contour}
      «∫ₐᵇ» Definite integral — The area under a curve between a and b.
      «∫+C» Indefinite integral — The antiderivative, plus a constant C.
      Fundamental theorem of calculus {ftc}
      «∫u dv» Integration by parts — ∫u dv = uv − ∫v du.
      «u =» Substitution — Change the variable to make an integral simpler.
      «▥» Riemann sums — Adding up thin rectangles under a curve.
      Trapezoidal and Simpson's rules {trapezoid_rule}
      Lebesgue integral {lebesgue}
        Measure theory {measure}
      «⟲» Volume of revolution — Spin a curve around an axis to make a solid.
      «∫^∞» Improper integrals — Integrals that stretch out to infinity.
      Gabriel's horn {gabriel}
      «ℱ» Integral transforms — Turn a function into a new one with an integral.
        Fourier transform {fourier}
        Laplace transform {laplace_t}
        Z-transform {z_transform}
        Mellin transform {mellin}
        Hilbert transform {hilbert_t}
        Radon transform {radon}
      Convolution {convolution}
      Error function {erf}
    Infinite series {series}
      «1+2+3» Arithmetic series — Adding numbers that go up by the same step.
      «1+½+¼» Geometric series — ½ + ¼ + ⅛ + … adds up to 1.
      Harmonic numbers {harmonic_num}
      Taylor series {taylor}
      Fourier series {fourier_series}
      «Σaₙxⁿ» Power series — An infinitely long polynomial.
      Generating functions {generating_fn}
      Grandi's series {grandi}
      «→ L» Convergence — When a series settles down to one value.
      «→ ∞» Divergence of a series — When a series grows forever.
      Zeno's dichotomy {zeno_dichotomy}
      Riemann zeta function {zeta}
        Bernoulli numbers {bernoulli}
        Polylogarithm {polylog}
    Triangular numbers {triangular} [<O+>]
      Tetrahedral numbers {tetrahedral}
      Figurate numbers {figurate}
        Pentagonal numbers {pentagonal}
        «⬡» Hexagonal numbers — 1, 6, 15, 28, …
      1 + 2 + … + 100 = 5050 {fact_gauss}
    Mean, median and mode {mean}
    Sum operator {sum_op}
    Counting {count}
      «𝍸» Tally marks — Lines grouped in fives to keep count.
      Successor function {successor}
        Peano axioms {peano}
      Combinatorics {combinations}
      Pigeonhole principle {pigeonhole}
      Inclusion–exclusion {inclusion_exclusion}
      Integer partitions {partition}
        Hardy–Ramanujan formula {hardy_ramanujan}
  «ℕ» Numbers — The things we count and measure with.
    Zero {zero}
      Zero is even {fact_zero_even}
      History of zero {fact_zero_history}
    Natural numbers {naturals}
      Even and odd numbers {evenodd}
      «1,3,5» Odd numbers — Numbers that leave 1 over when you split them into pairs.
      «0,1,2» Whole numbers — 0, 1, 2, 3, … with no fractions.
      Place value {place}
        «H T O» Ones, tens and hundreds — The columns that give each digit its value.
        «0–9» Digits — The ten symbols 0 to 9.
        Number bases {base}
          «1011₂» Binary — Base 2, using only 0 and 1.
          «FF₁₆» Hexadecimal — Base 16, using 0–9 and A–F.
          Roman numerals {fact_roman}
          «60» Base 60 — Babylonian counting, still used for minutes and seconds.
          Counting in tens {fact_base10}
        Abacus {abacus}
        Times ten shifts digits {fact_times10}
    Integers {integers}
    Rational numbers {rationals}
    Irrational numbers {irrational}
      √2 is irrational {fact_sqrt2}
      Pi {pi}
        Tau {tau}
        π never ends {fact_pi_irrational}
        Pi Day {fact_pi_day}
        Buffon's needle {buffon}
      Golden ratio {phi}
      Euler's number {euler}
      Transcendental numbers {transcendental}
    Real numbers {reals}
    Imaginary unit {imag}
      Complex numbers {complex_nums}
        Complex plane {complex_plane}
        Complex conjugate {conj}
        Real and imaginary part {realpart}
        Roots of unity {roots_of_unity}
        Euler's identity {fact_euler_identity}
        Mandelbrot set {mandelbrot}
      Quaternions {quaternion}
        Octonions {octonions}
    «√2, ∛5» Algebraic numbers — Numbers that solve a polynomial equation with whole-number coefficients.
    p-adic numbers {padic}
    Infinity {inf}
      Aleph-null {aleph}
      Cardinality of the continuum {continuum}
      Aleph-one {aleph1}
      Ordinal numbers {infinity_types}
        Omega {omega}
      Hilbert's Hotel {hilbert_hotel}
      Cantor's diagonal argument {cantor}
      Some infinities are bigger {fact_infinities}
      As many evens as numbers {fact_even_count}
      Countable and uncountable {infinity_hotel}
    «10¹⁰⁰» Big numbers — Numbers far too big to write out.
      Googol {fact_googol}
      «10^googol» Googolplex — 10 raised to the power of a googol.
      Graham's number {fact_graham}
      «TREE(3)» TREE(3) — A number from a game with trees, much bigger than Graham's number.
      «Rayo» Rayo's number — The biggest number you can name with a googol symbols of logic, plus one.
      «F₇» Fish numbers — Huge numbers made by boosting functions again and again.
      «Sk» Skewes' number — Once the biggest number used in a serious proof about primes.
      Busy beaver {busy_beaver}
      Ackermann function {ackermann}
    «★» Special numbers — Numbers with surprising patterns.
      Kaprekar's constant {kaprekar}
      Cyclic number 142857 {cyclic_num}
      Happy numbers {happy}
      Narcissistic numbers {narcissistic}
      Palindromic numbers {palindromic}
        Lychrel numbers {lychrel}
      Repunits {repunit}
        111,111,111² {fact_111}
      Keith numbers {keith}
      Automorphic numbers {automorphic}
      Kaprekar numbers {kaprekar_num}
      Polite numbers {polite}
      Interesting number paradox {interesting}
      Fibonacci numbers {fibonacci}
        Lucas numbers {lucas}
        Fibonacci in plants {fact_fib_nature}
    «ℕℤℚℝℂ» Number sets — The families of numbers, each inside the next.
      Natural numbers {naturals}
      Integers {integers}
      Rational numbers {rationals}
      Real numbers {reals}
      Complex numbers {complexes}
      Quaternions {quaternions_set}
  Functions {function}
    Linear function {linear}
      Slope {slope}
      «b» y-intercept — Where a line crosses the y-axis.
      Quadratic function {quadratic}
        Parabola {parabola}
        «−b±√» Quadratic formula — x = (−b ± √(b² − 4ac)) ÷ 2a.
        Plus or minus {pm}
          Minus or plus {mp}
        «b²−4ac» Discriminant — Tells you how many solutions a quadratic has.
        «(x+a)²» Completing the square — Rewriting x² + bx as a square plus a number.
        «∪» Vertex — The very tip of a parabola.
        Cubic function {cubic}
          Polynomial {polynomial}
            «xⁿ» Degree of a polynomial — The highest power in a polynomial.
            «f(x)=0» Roots — The x values where a function equals zero.
            Fundamental theorem of algebra {fta_algebra}
            Galois theory {galois}
            Factorising {factorising}
            Legendre polynomials {legendre_poly}
            Chebyshev polynomials {chebyshev}
            Hermite polynomials {hermite}
            Rational function {rational_fn}
    Power function {power_fn}
      Reciprocal function {reciprocal}
      Square root function {sqrt_fn}
    Trigonometry {trig}
      Sine {sin}
        Inverse sine {arcsin}
        Cosecant {csc}
      Cosine {cos}
        Inverse cosine {arccos}
        Secant {sec}
      Tangent {tan}
        Inverse tangent {arctan}
        Cotangent {cot}
      Theta {theta}
      Unit circle {unit_circle}
      SOH CAH TOA {sohcahtoa}
      Law of sines and cosines {law_sines}
      Radians {radian}
        Radians make calculus simpler {fact_circle_degrees}
      Hyperbolic sine {sinh}
        Hyperbolic cosine {cosh}
        Hyperbolic tangent {tanh}
        Inverse hyperbolic functions {arsinh}
        Gudermannian function {gudermannian}
      «∿» Waves — Repeating up-and-down patterns.
        Periodic function {periodic}
        Square wave {square_wave}
        Sawtooth wave {sawtooth}
        Triangle wave {triangle_wave}
        Sinc function {sinc}
    «⌊ ⌉» Rounding functions — Functions that turn decimals into whole numbers.
      Ceiling function {ceil}
      Floor function {floor}
      Rounding {round}
      Fractional part {frac_part}
      Sign function {sign}
      Absolute value function {abs_fn}
      Integer part {floor_op}
    Exponential function {exponential}
      Natural logarithm {ln}
      Logistic sigmoid {sigmoid}
      Gaussian function {gaussian}
      Lambert W function {lambert}
    «Γ ζ J» Special functions — Famous functions with their own names.
      Gamma function {gamma}
      Bessel functions {bessel}
      Airy function {airy}
      Elliptic functions {elliptic_fn}
      Hypergeometric function {hypergeometric}
      Riemann zeta function {zeta}
      Dirac delta {dirac}
      Heaviside step function {heaviside}
      Indicator function {characteristic_fn}
    «f» Function ideas — Words for how functions behave.
      Inverse function {inverse}
        Inverse symbol {inverse_sym}
      Composite function {composite_fn}
        Composition {compose}
      Identity function {identity_fn}
      Constant function {constant_fn}
      Piecewise function {piecewise}
      Even and odd functions {even_odd_fn}
      Injective, surjective, bijective {bijection}
      «x ↦ y» Domain and range — The inputs a function takes, and the outputs it gives.
      Maps to {mapsto}
      Continuous function {continuous}
      Differentiable function {differentiable}
      Recursive function {recursion}
        Tower of Hanoi {hanoi}
      Sequence {sequence}
        Arithmetic and geometric sequences {sequences_ap}
        Collatz conjecture {collatz}
        Kaprekar's routine {kaprekar}
      Big O notation {bigO}
      Asymptotic {approx_tilde}
      «🕳» Strange functions — Functions that broke people's intuition.
        Weierstrass function {weierstrass}
        Dirichlet function {dirichlet_fn}
        Thomae's function {thomae}
        Cantor function {cantor_fn}
      «🤖» Functions in AI — Functions used inside neural networks.
        ReLU {relu}
        Softmax {softmax}
    Derivative {deriv} [<o∫>]
      Second derivative {deriv2} [<r d/dx>]
      Infinitesimal d {dsym}
      Prime mark {prime_mark}
      Partial derivative {partial}
        Nabla {nabla}
          Gradient {gradient}
          Divergence {divergence}
          Curl {curl}
          Laplacian {laplacian}
            Nabla squared {nabla_sq}
            d'Alembertian {dalembertian}
          Covariant derivative {covariant}
          Exterior derivative {exterior_d}
          Material derivative {material_deriv}
        Jacobian {jacobian}
        Hessian {hessian}
      Limit {limit}
        Epsilon {epsilon}
        Tends to {arrow}
      «nxⁿ⁻¹» Power rule — The derivative of xⁿ is nxⁿ⁻¹.
      «(uv)′» Product rule — (uv)′ = u′v + uv′.
      «(u/v)′» Quotient rule — (u/v)′ = (u′v − uv′) ÷ v².
      «f(g)′» Chain rule — The derivative of f(g(x)) is f′(g(x)) · g′(x).
      «⟋» Tangent lines — Lines that just touch a curve at one point.
      «⌒» Maxima and minima — The highest and lowest points, where the slope is 0.
      Newton's method {newton_method}
      Differential equations {diffeq}
        Euler's method {euler_method}
        Chaos theory {chaos}
          Lorenz attractor {lorenz}
      Fractional derivative {fractional_deriv}
      Calculus of variations {variation}
      Calculus {calculus}
      Wronskian {wronskian}
  Algebra {algebra}
    Variables {variable}
      Letters stand for numbers {fact_x_variable}
      «y» y — The usual second unknown, and the up-and-down axis on a graph.
      «a,b,c» a, b and c — Letters often used for numbers we know.
      «z» z — The third unknown, and the third axis in 3-D.
    «k» Constants — Numbers that don't change, like 5 or π.
    «3x» Coefficients — The number in front of a letter: the 3 in 3x.
    «+ −» Terms — The parts of an expression between the + and − signs.
    «3x+2» Expressions — Mixtures of numbers and letters, like 3x + 2.
    Equations {equation}
      Balancing both sides {fact_equal_sides}
      Simultaneous equations {sim_equations}
        Gaussian elimination {gauss_elim}
      Inequalities {inequality}
      Diophantine equations {diophantine}
        Pell's equation {pell}
        Fermat's Last Theorem {flt}
        Pythagorean triples {pyth_triples}
      Defined as {defined}
    «A=lw» Formulas — Rules written with letters, like A = length × width.
    «2(x+3)» Expanding brackets — 2(x + 3) = 2x + 6.
    Factorising {factorising}
    Order of operations {order}
      Parentheses {paren}
      BODMAS and PEMDAS {fact_order}
    The word algebra {fact_algebra_word}
    Linear algebra {linear_algebra}
      Vectors {vector}
        Adding vectors {vectors_add}
        Dot product {dotprod}
        Inner product {inner_product}
        Cross product {crossprod}
        Norm {norm}
        Unit vectors {hat}
        Vector arrow {vecarrow}
        Wedge product {wedge}
      Matrices {matrix}
        Determinant {determinant}
        Transpose {transpose}
          Dagger {dagger}
        Matrix inverse {matinv}
        Trace {trace}
        Eigenvalues and eigenvectors {eigen}
          Lambda {lambda}
        Kronecker delta {kronecker}
        Outer product {outer_product}
        Commutator {commutator}
          Lie bracket {lie_bracket}
      Tensors {tensor}
        Levi-Civita symbol {levi_civita}
      Hilbert space {hilbert_space}
        Bra-ket notation {dirac_bra_ket}
      Direct sum {directsum}
    «G» Abstract algebra — Algebra about structures, not just numbers.
      Groups {group}
        Symmetry {symmetry}
        Rubik's cube group {rubik}
      Rings and fields {ring}
      Galois theory {galois}
      Boolean algebra {boolean}
      Category theory {category}
  «△» Geometry — The maths of shapes, sizes and space.
    «•» Dots — Points: exact places with no size.
    «—» Lines — Straight paths that go on forever in both directions.
      «→» Rays — Lines that start at a point and go one way forever.
      «•—•» Line segments — Pieces of a line with two ends.
        «ℓ» Length — How long something is.
        «M» Midpoint — The point exactly halfway along.
      Parallel {parallel}
      Perpendicular {perp}
      «✕» Intersections — Where lines cross each other.
      «d» Distance — How far apart two points are.
        «√(Δx²+Δy²)» Distance formula — Pythagoras on a grid.
      «∥ ∥» Same length — Equal lengths, marked with matching little ticks.
      Points, lines and rays {line_ray}
    Angles {angle}
      «∠<90°» Acute angles — Less than 90°.
      «∟» Right angles — Exactly 90°.
      «∠>90°» Obtuse angles — Between 90° and 180°.
      «180°» Straight angles — Exactly 180°.
      «>180°» Reflex angles — More than 180°.
      Types of angles {angle_types}
      Degree {deg}
        Arcminutes and arcseconds {minutes}
      Radians {radian}
      Angle symbol {anglesym}
      «◠» Protractor — The tool for measuring angles.
      «90°» Complementary angles — Two angles that add to 90°.
      «180°» Supplementary angles — Two angles that add to 180°.
      «✕» Vertically opposite angles — The equal angles across two crossing lines.
      A full turn is 360° {fact_circle_360}
    Polygons {polygon}
      Triangle {triangle}
        Types of triangles {triangle_types}
        «▲» Equilateral triangle — All three sides equal.
        «△» Isosceles triangle — Two sides equal.
        «◺» Scalene triangle — No sides equal.
        «◣» Right triangle — A triangle with a 90° angle.
          Pythagorean theorem {pythag}
            Pythagorean triples {pyth_triples}
          «c» Hypotenuse — The longest side, opposite the right angle.
          Trigonometry {trig}
        Angles add to 180° {fact_triangle_angles}
        Congruent {congruent}
        Similar {similar}
        Missing square puzzle {missing_square}
      Quadrilaterals {quadrilateral}
        «■» Square — 4 equal sides and 4 right angles.
        «▬» Rectangle — 4 right angles; opposite sides equal.
        «◆» Rhombus — 4 equal sides.
        «▱» Parallelogram — Two pairs of parallel sides.
        «⏢» Trapezoid — One pair of parallel sides.
        «◇» Kite — Two pairs of equal sides next to each other.
        Angles add to 360° {fact_quad_angles}
      «⬠» Pentagon — 5 sides.
      «⬡» Hexagon — 6 sides. Honeycombs are made of them.
      «7» Heptagon — 7 sides.
      «⯃» Octagon — 8 sides, like a stop sign.
      «10» Decagon — 10 sides.
      «⬢» Regular polygons — Every side and every angle equal.
        «a» Apothem — From the centre straight to the middle of a side.
      «⬟» Convex and concave — Shapes that bulge outward, or cave inward.
      «✦» Irregular shapes — Shapes whose sides and angles aren't all equal.
        «★» Star — A shape with points, made by a concave polygon.
      Tessellations {tessellation}
        Penrose tiling {penrose}
    Circle {circle}
      «r» Radius — From the centre to the edge.
      «d» Diameter — Straight across through the centre: two radiuses.
      «C» Circumference — The distance all the way around: 2πr.
      Pi {pi}
      Arc {arc}
      «⌓» Chord — A line joining two points on a circle.
      «◔» Sector — A pizza-slice part of a circle.
      «⊙—» Tangent line — A line that touches a circle at exactly one point.
      Parts of a circle {circle_parts}
      «⬯» Ovals — Egg shapes and stretched circles.
        Ellipse {ellipse}
      Conic sections {conic}
        Parabola {parabola}
        Hyperbola {hyperbola}
    «📏» Measurement — Finding sizes.
      «P» Perimeter — The distance around a shape.
      Area {area}
      Volume {volume}
      «h» Height — How tall something is.
      «w» Width — How wide something is.
      «d» Depth — How deep something is.
      Units and conversions {units}
      Same perimeter, different area {fact_perimeter_area}
      «SA» Surface area — The total area of all the faces of a solid.
    «⬛» 3-D shapes — Solid shapes that take up space.
      «▣» Cube — 6 square faces.
      «▭» Cuboid — A box shape with rectangle faces.
      Sphere {sphere}
      Cylinder {cylinder}
      Cone {cone}
      Pyramid {pyramid}
      Prism {prism}
      Torus {torus}
      Platonic solids {platonic}
        «4» Tetrahedron — 4 triangle faces.
        «8» Octahedron — 8 triangle faces.
        «12» Dodecahedron — 12 pentagon faces.
        «20» Icosahedron — 20 triangle faces.
      «⬢» Convex solids — Solids with no dents or holes.
      «V E F» Faces, edges and vertices — The flat sides, the lines and the corners of a solid.
        Euler characteristic {euler_char}
      «✚» Nets — Flat patterns that fold up into a solid.
    Cartesian coordinates {coords}
      «📈» 2-D graphs — Plotting points using x and y.
      «🧊» 3-D graphs — Adding a third axis, z.
      Polar coordinates {polar}
      Dimensions {dimension}
        «3D» 3-D — Length, width and height.
        Fourth dimension {four_dim}
          Tesseract {tesseract}
        «nD» Nth dimensions — Spaces with any number of directions.
    Transformations {transformations}
      «→» Translation — Sliding a shape.
      «↻» Rotation — Turning a shape.
      «⇋» Reflection — Flipping a shape in a mirror line.
      «⤢» Enlargement — Making a shape bigger or smaller.
      Symmetry {symmetry}
    «⊙» Constructions — Drawing exact shapes with tools.
      Compass and straightedge {compass_straightedge}
      Origami mathematics {origami}
    Non-Euclidean geometry {hyperbolic_geom}
    Fractals {fractal}
      Sierpiński triangle {sierpinski}
      Koch snowflake {koch}
      Cantor set {cantor_set}
      Menger sponge {menger}
      Mandelbrot set {mandelbrot}
      Hilbert curve {hilbert_curve}
      Space-filling curves {space_filling}
      Coastline paradox {coastline}
    Topology {topology}
      Möbius strip {mobius}
      Klein bottle {klein}
      Torus {torus}
      Knot theory {knot}
      Manifolds {manifold}
      Metric spaces {metric_space}
      Poincaré conjecture {poincare}
      Hairy ball theorem {hairy_ball}
      Brouwer fixed-point theorem {brouwer}
      Ham sandwich theorem {ham_sandwich}
      Sphere eversion {smale}
    «●●» Packing — Fitting shapes together as tightly as possible.
      Sphere packing {sphere_packing}
      Kissing number {kissing}
  «<>» Comparisons — Saying which is bigger, smaller or the same.
    Equals sign {eq} [=]
      Not equal to {neq}
      Approximately equal {approx}
      Identical to {equiv}
      Defined as {defined}
    Less than {lt}
      Less than or equal to {le}
      Much less than {muchless}
    Greater than {gt}
      Greater than or equal to {ge}
      Much greater than {muchgreater}
    «min» Minimum — The smallest value in a list.
    «max» Maximum — The biggest value in a list.
    «1<2<3» Ordering — Putting numbers from smallest to largest.
    Inequalities {inequality}
    Estimation {estimation}
  Sets {set}
    Empty set {empty}
    Subset {subset}
      Proper subset {proper_subset}
      Superset {superset}
      Not a subset {not_subset}
    Union {union}
      Big union {bigunion}
    Intersection {inter}
      Big intersection {biginter}
    Element of {elem}
      Not an element of {notelem}
    Set difference {setminus}
    Complement {complement}
    Power set {powerset}
    Cardinality {hash}
    Cartesian product {cartesian}
    Symmetric difference {symdiff}
    «◯◯» Venn diagrams — Overlapping circles that show how sets share members.
    Inclusion–exclusion {inclusion_exclusion}
    Russell's paradox {russell}
    ZFC set theory {zfc}
      Axiom of choice {choice}
        Banach–Tarski paradox {banach_tarski}
      Continuum hypothesis {continuum_hyp}
  Statistics {statistics}
    Mean, median and mode {mean}
      Mean and median can differ {fact_mean_median}
    «M» Median — The middle value when the data is in order.
    «Mo» Mode — The value that appears most often.
    «R» Range — The biggest value minus the smallest.
    Quartiles and percentiles {quartiles}
    Variance {variance}
    Standard deviation {stdev}
      Lowercase sigma {sigma_small}
    Normal distribution {normal}
      Central limit theorem {clt}
    Charts and graphs {charts}
    Correlation {correlation}
    Linear regression {regression}
    Simpson's paradox {simpson}
    Benford's law {benford}
    Zipf's law {zipf}
    Mu {mu}
    Chi {chi}
  Probability {probability}
    «P» Chance — How likely something is, from 0 (never) to 1 (certain).
    «Ω» Outcomes — All the possible results of an experiment.
    Expected value {expected}
      Expectation operator {expectation}
    Bayes' theorem {bayes}
      Base rate fallacy {base_rate}
    Law of large numbers {lln}
    Monte Carlo method {monte_carlo}
    Markov chains {markov}
    Random walk {random_walk}
    Gambler's fallacy {gambler}
    Infinite monkey theorem {infinite_monkey}
    Game theory {game_theory}
      Prisoner's dilemma {prisoners}
      Nash equilibrium {nash}
      Zero-sum games {zero_sum}
    «?» Probability puzzles — Questions where the answer surprises people.
      Monty Hall problem {monty_hall}
      Birthday paradox {birthday}
      Boy or girl paradox {boy_girl}
      Bertrand's box paradox {bertrand_box}
      Penney's game {penney}
      Nontransitive dice {nontransitive_dice}
      Two-socks puzzle {sock}
  Logic {logic}
    Logical not {not}
    Logical and {and}
      NAND {nand}
    Logical or {or}
      Exclusive or {xor}
    Implies {implies}
      Is implied by {leftarrow}
      If and only if {iff}
        iff {iff_short}
    For all {forall}
    There exists {exists}
      There does not exist {nexists}
    True {truesym}
    Therefore {therefore}
      Because {because}
    Proves {proves}
      Models {models}
    Proof {proof}
      Proof by induction {induction}
      Proof by contradiction {contradiction}
      End of proof {qed}
    Gödel's incompleteness theorems {godel}
    «⚙» Computation — What computers and step-by-step rules can and can’t do.
      Turing machine {turing_machine}
      Halting problem {halting}
      P vs NP {pvsnp}
      Lambda calculus {lambda_calc}
      Cellular automata {cellular_automata}
        Conway's Game of Life {game_of_life}
      Busy beaver function {busy_beaver}
    «⁉» Paradoxes — Puzzles where good reasoning seems to break.
      @group par
  Graph theory {graph_theory}
    Trees {tree_graph}
    Euler paths {euler_path}
      Seven bridges of Königsberg {konigsberg}
    Four colour theorem {four_color}
    Planar graphs {planar}
    Shortest path {shortest_path}
    Travelling salesman problem {tsp}
    Ramsey theory {ramsey}
    Erdős number {erdos_number}
    Braess's paradox {braess}
  «🧩» Puzzles and games — Mathematical fun.
    Magic squares {magic_square}
    Latin squares and Sudoku {latin_square}
    The 1089 trick {fact_1089}
    Tower of Hanoi {hanoi}
    Hooper's paradox {hooper}
    Missing dollar riddle {missing_dollar}
    Rubik's cube group {rubik}
  «🏆» Famous problems — Big questions, some still unsolved.
    Millennium Prize Problems {millennium}
      Riemann hypothesis {riemann_hyp}
      P vs NP {pvsnp}
      Poincaré conjecture {poincare}
    Hilbert's problems {hilbert_problems}
    Landau's problems {landau}
    Collatz conjecture {collatz}
    Twin prime conjecture {twin_prime}
    abc conjecture {abc}
    Goldbach conjecture {goldbach}
    Waring's problem {waring}
    Four-square theorem {four_squares}
    Two-squares theorem {two_squares}
    Continuum hypothesis {continuum_hyp}
  «🛒» Everyday maths — Maths you use every day.
    Money and interest {money_math}
    Time and clocks {time_math}
    Estimation {estimation}
    Units and conversions {units}
    Average speed trap {fact_average_trap}
    Dozen and gross {fact_dozen}
    Calculators used to be people {fact_calculator_word}
  «💡» Facts — Handy things to know.
    @group fact
`;
