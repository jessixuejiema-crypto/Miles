/* The Math Tree outline. One line per box; two spaces of indent = one level down.
 * A box sits under the idea it grows out of, so the tree runs in long chains.
 *   «sym» Label {entry_id} [code] — short description
 * Every part except Label is optional. A box with no {id} is linked by name when
 * the Math Book has a matching entry. "@group key" adds every entry of that group
 * that isn't already in the tree.
 */
window.MATH_TREE_OUTLINE = String.raw`
Addition {add} [+]
  Counting {count}
    «𝍸» Tally marks — Lines grouped in fives to keep count.
    Successor function {successor}
      Peano axioms {peano}
        Proof by induction {induction}
          Proof {proof}
            Proof by contradiction {contradiction}
              √2 is irrational {fact_sqrt2}
              Infinitely many primes {infinite_primes}
            End of proof {qed}
            Gödel's incompleteness theorems {godel}
              Halting problem {halting}
                Turing machine {turing_machine}
                  Lambda calculus {lambda_calc}
                  Cellular automata {cellular_automata}
                    Conway's Game of Life {game_of_life}
                Busy beaver function {busy_beaver}
                P vs NP {pvsnp}
                  Travelling salesman problem {tsp}
                  Big O notation {bigO}
    Natural numbers {naturals}
      «0–9» Digits — The ten symbols 0 to 9.
        Place value {place}
          «H T O» Ones, tens and hundreds — The columns that give each digit its value.
            Times ten shifts digits {fact_times10}
              Powers of 10 — 10, 100, 1000, … Each is a 1 followed by zeros.
                Scientific notation {sci}
                  Googol {fact_googol}
          Counting in tens {fact_base10}
            Number bases {base}
              «1011₂» Binary — Base 2, using only 0 and 1.
                Boolean algebra {boolean}
                  NAND {nand}
                    Exclusive or {xor}
                Powers of 2 — 1, 2, 4, 8, 16, … The numbers computers love.
              «FF₁₆» Hexadecimal — Base 16, using 0–9 and A–F.
              «60» Base 60 — Babylonian counting, still used for minutes and seconds.
                Time and clocks {time_math}
                  Clock arithmetic {mod}
                Arcminutes and arcseconds {minutes}
              Roman numerals {fact_roman}
          Abacus {abacus}
            Calculators used to be people {fact_calculator_word}
      Even and odd numbers {evenodd}
        «1,3,5» Odd numbers — Numbers that leave 1 over when you split them into pairs.
          Odd squares {fact_odd_square}
          Sums of odd numbers {fact_squares_odd}
        Zero is even {fact_zero_even}
        Collatz conjecture {collatz}
      Zero {zero}
        History of zero {fact_zero_history}
        «0,1,2» Whole numbers — 0, 1, 2, 3, … with no fractions.
          Integers {integers}
            Negative numbers {neg}
              Number line {number_line}
                Rational numbers {rationals}
                  Farey sequence {farey}
                  Real numbers {reals}
                    Irrational numbers {irrational}
                      Transcendental numbers {transcendental}
                        Pi {pi}
                          Tau {tau}
                          π never ends {fact_pi_irrational}
                          Pi Day {fact_pi_day}
                          Buffon's needle {buffon}
                        Euler's number {euler}
                          e is irrational {fact_e_irrational}
                      «√2, ∛5» Algebraic numbers — Numbers that solve a polynomial equation with whole-number coefficients.
                        Golden ratio {phi}
                    Cardinality of the continuum {continuum}
                      Continuum hypothesis {continuum_hyp}
                    Complex numbers {complex_nums}
                      Complex plane {complex_plane}
                        Roots of unity {roots_of_unity}
                        Mandelbrot set {mandelbrot}
                      Complex conjugate {conj}
                      Real and imaginary part {realpart}
                      Euler's identity {fact_euler_identity}
                      Quaternions {quaternion}
                        Octonions {octonions}
                          Number sets {complexes}
                    p-adic numbers {padic}
                Absolute value {abs}
              Negative × negative {fact_neg_neg}
            Gaussian integers {gaussian_int}
        Signed zero {plusminus_zero}
      Infinity {inf}
        Aleph-null {aleph}
          Hilbert's Hotel {hilbert_hotel}
            As many evens as numbers {fact_even_count}
              Galileo's paradox {galileo}
          Cantor's diagonal argument {cantor}
            Some infinities are bigger {fact_infinities}
              Aleph-one {aleph1}
                Ordinal numbers {infinity_types}
                  Omega {omega}
            Countable and uncountable {infinity_hotel}
    Combinatorics {combinations}
      Pigeonhole principle {pigeonhole}
        Two-socks puzzle {sock}
        Ramsey theory {ramsey}
      Inclusion–exclusion {inclusion_exclusion}
      Integer partitions {partition}
        Hardy–Ramanujan formula {hardy_ramanujan}
  Subtraction {sub} [<o+>]
    «−» Borrowing — Taking 1 from the next column when you subtract.
    «a − b» Minuend and subtrahend — The number you start with, and the number you take away.
    Minus has two jobs {fact_minus_two_meanings}
      Negation {negation}
        Absolute value {abs}
          Absolute value function {abs_fn}
            «d» Distance — How far apart two points are, always positive.
          Norm {norm}
    Difference {delta} [<s−>]
      «Δ» Change — How much something went up or down.
        Slope {slope}
          Derivative {deriv}
      Forward difference {forward_diff}
        Backward difference {backward_diff}
          Shift operator {shift_op}
    Kaprekar's constant {kaprekar}
    The 1089 trick {fact_1089}
  Multiplication {mul} [<r+>]
    «12×12» Times tables — The multiplication facts from 1 × 1 up to 12 × 12.
      Anything times one {fact_times_one}
        Anything times zero {fact_times_zero}
          Nines trick {fact_nine_trick}
      Many ways to write × {fact_mult_symbols}
        Multiplication dot {dot}
          Dot product {dotprod}
            Inner product {inner_product}
              Hilbert space {hilbert_space}
                Bra-ket notation {dirac_bra_ket}
    Swapping the order {fact_commutative}
      «(ab)c» Associative law — (ab)c = a(bc): grouping doesn't matter.
        «a(b+c)» Distributive law — a(b + c) = ab + ac.
          «2(x+3)» Expanding brackets — 2(x + 3) = 2x + 6.
            Factorising {factorising}
    «×» Long multiplication — Multiply by each digit, then add the rows.
      «▦» Lattice multiplication — A grid method used in the Middle Ages.
    Area {area}
      «P» Perimeter — The distance around a shape.
        Same perimeter, different area {fact_perimeter_area}
      Volume {volume}
        «SA» Surface area — The total area of all the faces of a solid.
    Exponentiation {pow} [<r<r+>>]
      Exponent rules {fact_exp_rules}
        Power of zero {fact_power_zero}
          Negative exponents {fact_neg_exp}
            Fractional exponents {fact_frac_exp}
              Nth roots {nroot} [<o<r<r+>>>]
      Squaring {sq}
        Square numbers {square_nums}
          «n²» Perfect squares — Numbers like 1, 4, 9, 16 made by squaring whole numbers.
            Perfect powers {perfect_power}
          Four-square theorem {four_squares}
            Waring's problem {waring}
          Two-squares theorem {two_squares}
        Square root {sqrt}
          Square root function {sqrt_fn}
          Schizophrenic numbers {schizophrenic}
          Square root of −1 {sqrt_neg}
            Imaginary unit {imag}
              Complex numbers {complex_nums}
        Cubing {cube}
          Cube numbers {cube_nums}
            Taxicab number 1729 {taxicab}
              Sums of three cubes {sum_of_cubes}
          Cube root {cbrt}
      Tetration {tetration} [<r<r<r+>>>]
        Knuth's up-arrows {uparrow}
        «ⁿ√ₛ» Super-root — Undoes tetration: which x has xˣ = 27? x = 3.
        Pentation {pentation}
          Hyperoperations {hyperoperation}
            Ackermann function {ackermann}
              «10¹⁰⁰» Big numbers — Numbers far too big to write out.
                Googol {fact_googol}
                  «10^googol» Googolplex — 10 raised to the power of a googol.
                    «Sk» Skewes' number — Once the biggest number used in a serious proof about primes.
                      Graham's number {fact_graham}
                        «TREE(3)» TREE(3) — A number from a game with trees, much bigger than Graham's number.
                          «F₇» Fish numbers — Huge numbers made by boosting functions again and again.
                            Busy beaver function {busy_beaver}
                              «Rayo» Rayo's number — The biggest number you can name with a googol symbols of logic, plus one.
      Logarithms {log}
        Natural log {ln}
          Euler's number {euler}
            Exponential function {exponential} [<s<r<r+>>>]
              «2ⁿ» Exponential growth — Doubling again and again.
                Compound interest {money_math}
              «½ⁿ» Exponential decay — Halving again and again, like radioactive half-lives.
              Logistic sigmoid {sigmoid}
                ReLU {relu}
                Softmax {softmax}
            Euler's identity {fact_euler_identity}
        «log₂» Binary logarithm — How many times you halve a number to reach 1.
        Log scales {log_scale}
          Slide rule {slide_rule}
          Benford's law {benford}
            Zipf's law {zipf}
      Exponential factorial {exp_factorial} [<O<r<r+>>>]
    Factorial {fact} [<O<r+>>]
      Zero factorial {fact_zero_fact}
      Double factorial {double_factorial}
      Superfactorial {superfactorial} [<O<O<r+>>>]
      Gamma function {gamma} [<s<O<r+>>>]
        Beta function {beta_fn}
        Digamma function {digamma}
      «n!≈» Stirling's approximation — n! is about √(2πn)·(n/e)ⁿ.
      Permutations {perm}
        Combinations {choose}
          Handshakes {fact_handshakes}
          Pascal's triangle {pascal}
            Binomial theorem {binomial}
              Probability {probability}
                Expected value {expected}
                  Expectation operator {expectation}
                  St. Petersburg paradox {st_petersburg}
                  Law of large numbers {lln}
                    Monte Carlo method {monte_carlo}
                    Central limit theorem {clt}
                      Normal distribution {normal}
                Bayes' theorem {bayes}
                  Base rate fallacy {base_rate}
                Markov chains {markov}
                  Random walk {random_walk}
            Sierpiński triangle {sierpinski}
            Catalan numbers {catalan}
      Wilson's theorem {wilson}
      Brocard's problem {brocard}
    Division {div} [<o<r+>>]
      «÷» Long division — Divide one digit at a time from the left.
      Can't divide by zero {fact_div_zero}
        Zero divided by a number {fact_zero_div}
      Fractions {frac}
        «a/» Numerator — The top number of a fraction.
        «/b» Denominator — The bottom number of a fraction.
        «¾» Proper fraction — The top is smaller than the bottom, like 3/4.
          «⁷⁄₄» Improper fraction — The top is bigger than the bottom, like 7/4.
            «1¾» Mixed fraction — A whole number and a fraction together, like 1¾.
        «½=²⁄₄» Equivalent fractions — 1/2 = 2/4 = 3/6: same amount, different numbers.
          «⁶⁄₈→¾» Simplifying fractions — Divide the top and bottom by their gcd.
        Fraction bar {slash}
        «⅟» Unit fractions — Fractions with 1 on top, like ⅓.
          Egyptian fractions {egyptian}
            Erdős–Straus conjecture {erdos_straus}
          Harmonic numbers {harmonic_num}
        Reciprocal {reciprocal}
          Dividing by a fraction {fact_div_fraction}
          Reciprocal function {reciprocal}
            Hyperbola {hyperbola}
        Decimals {decimal}
          Decimal point {decpoint}
            Decimal comma {fact_decimal_comma}
          Repeating decimals {bar}
            0.999… = 1 {fact_point_nine}
            Cyclic number 142857 {cyclic_num}
          Rounding {round}
            Significant figures {rounding_sig}
              Estimation {estimation}
          Percentages {pct}
            Per mille {permille}
              Per ten thousand {permyriad}
            «Δ%» Percent change — (new − old) ÷ old × 100.
            Swapping percentages {fact_percent_swap}
            Potato paradox {potato}
        Continued fractions {contfrac}
          Golden ratio {phi}
            Golden rectangle {golden_rect}
              Golden spiral {golden_spiral}
      Ratios {ratio}
        Ratio colon {ratiosym}
        Proportion {proportion}
          Proportional to {propto}
            «1:100» Scale drawings — Maps and models where 1 cm can stand for 1 km.
        «km/h» Rates — Ratios with units, like kilometres per hour.
          «d/t» Speed — Distance ÷ time.
            Average speed trap {fact_average_trap}
          Units and conversions {units}
      Repeated division {log} [<r÷>]
      «r» Remainders — What is left over after dividing.
        Modular arithmetic {mod}
          «n» Modulus — The number you divide by in mod arithmetic.
          Digital root {digital_root}
            Divisibility by 3 and 9 {fact_div3}
          Congruence {congruence}
            Fermat's little theorem {fermat_little}
              Pseudoprimes {pseudoprime}
                Carmichael numbers {carmichael}
                  Miller–Rabin test {miller_rabin}
              Wieferich primes {wieferich}
              Euler's totient {totient}
                Euler's theorem {euler_thm}
                  RSA cryptography {crypto}
            Chinese remainder theorem {crt}
            Quadratic residues {quad_res}
              Legendre symbol {legendre}
                Quadratic reciprocity {quad_recip}
            Primitive roots {primitive_root}
      Divisibility {divisibility}
        Does not divide {notdivides}
        Divisibility by 2, 4 and 8 {fact_div4}
        Divisibility by 5 and 10 {fact_div5}
        Divisibility by 11 {fact_div11}
        Harshad numbers {harshad}
        «a × b» Factors — Numbers that multiply together to make a number.
          «3, 6, 9» Multiples — The answers in a times table: 3, 6, 9, 12, …
            Lowest common multiple {lcm}
          Greatest common factor {gcd}
            Euclidean algorithm {euclid_alg}
              Bézout's identity {bezout}
                Diophantine equations {diophantine}
                  Pell's equation {pell}
                  Pythagorean triples {pyth_triples}
                    Fermat's Last Theorem {flt}
            Coprime numbers {coprime}
              Dirichlet's theorem {dirichlet_ap}
          Divisor functions {divisor_fn}
            Perfect numbers {perfect}
              Euclid–Euler theorem {euclid_euler}
              Abundant numbers {abundant}
                Practical numbers {practical}
              Deficient numbers {deficient}
              Amicable numbers {amicable}
                Sociable numbers {sociable}
                  Aliquot sequences {aliquot}
                    Untouchable numbers {untouchable}
            Highly composite numbers {highly_composite}
          Prime numbers {prime}
            One is not prime {fact_one_prime}
            Two is the only even prime {fact_two_prime}
            Primes are 6k ± 1 {fact_prime_6k}
            Sieve of Eratosthenes {sieve}
            Composite numbers {composite}
              Semiprimes {semiprime}
              Smith numbers {smith}
            Prime factorization {fta}
              Möbius function {mobius_fn}
              Liouville function {liouville_fn}
              Primorial {primorial}
              abc conjecture {abc}
            Twin primes {twin_prime}
              Prime gaps {prime_gap}
                Bertrand's postulate {bertrand_post}
                  Legendre's conjecture {legendre_conj}
                    Landau's problems {landau}
                      Goldbach conjecture {goldbach}
            Mersenne primes {mersenne}
              Largest known prime {fact_largest_prime}
            Sophie Germain primes {sophie_germain}
            Fermat numbers {fermat_numbers}
            Emirps {emirp}
            Ulam spiral {ulam}
            Set of primes {primes_set}
            Prime-counting function {prime_count}
              Prime number theorem {pnt}
                Logarithmic integral {li}
                  Riemann zeta function {zeta}
                    Riemann hypothesis {riemann_hyp}
                      Millennium Prize Problems {millennium}
                        Poincaré conjecture {poincare}
                        P vs NP {pvsnp}
                    Bernoulli numbers {bernoulli}
                    Polylogarithm {polylog}
    Matrix multiplication {matmul}
      Matrices {matrix}
        Determinant {determinant}
          Matrix inverse {matinv}
          Wronskian {wronskian}
          Jacobian {jacobian}
        Transpose {transpose}
          Dagger {dagger}
        Trace {trace}
        Kronecker delta {kronecker}
        Eigenvalues and eigenvectors {eigen}
          Lambda {lambda}
        Commutator {commutator}
          Lie bracket {lie_bracket}
        Gaussian elimination {gauss_elim}
        Tensors {tensor}
          Tensor product {tensorprod}
          Levi-Civita symbol {levi_civita}
          Covariant derivative {covariant}
    Cross product {crossprod}
      Wedge product {wedge}
        Exterior derivative {exterior_d}
  Summation {sigma} [<s+>]
    Sum operator {sum_op}
    Product of {prodsym} [<s<r+>>]
      Product operator {prod_op}
    Triangular numbers {triangular} [<O+>]
      1 + 2 + … + 100 = 5050 {fact_gauss}
      Tetrahedral numbers {tetrahedral}
      Figurate numbers {figurate}
        Pentagonal numbers {pentagonal}
          «⬡» Hexagonal numbers — 1, 6, 15, 28, …
      Polite numbers {polite}
    Mean, median and mode {mean}
      Statistics {statistics}
        «M» Median — The middle value when the data is in order.
          Quartiles and percentiles {quartiles}
          Mean and median can differ {fact_mean_median}
        «Mo» Mode — The value that appears most often.
        «R» Range — The biggest value minus the smallest.
          Variance {variance}
            Standard deviation {stdev}
              Lowercase sigma {sigma_small}
              Normal distribution {normal}
                Gaussian function {gaussian}
                  Error function {erf}
        Charts and graphs {charts}
          Correlation {correlation}
            Linear regression {regression}
          Simpson's paradox {simpson}
        Mu {mu}
        Chi {chi}
    Infinite series {series}
      «1+2+3» Arithmetic series — Adding numbers that go up by the same step.
        Arithmetic and geometric sequences {sequences_ap}
      «1+½+¼» Geometric series — ½ + ¼ + ⅛ + … adds up to 1.
        Zeno's dichotomy {zeno_dichotomy}
          Zeno's Achilles and the tortoise {zeno_achilles}
            Thomson's lamp {thomson_lamp}
      Grandi's series {grandi}
      «→ L» Convergence — When a series settles down to one value.
        Limit {limit}
          Epsilon {epsilon}
          Tends to {arrow}
          Continuous function {continuous}
            Differentiable function {differentiable}
              Derivative {deriv} [<o∫>]
                Infinitesimal d {dsym}
                Prime mark {prime_mark}
                «nxⁿ⁻¹» Power rule — The derivative of xⁿ is nxⁿ⁻¹.
                  «(uv)′» Product rule — (uv)′ = u′v + uv′.
                    «(u/v)′» Quotient rule — (u/v)′ = (u′v − uv′) ÷ v².
                      «f(g)′» Chain rule — The derivative of f(g(x)) is f′(g(x)) · g′(x).
                «⟋» Tangent lines — Lines that just touch a curve at one point.
                  «⌒» Maxima and minima — The highest and lowest points, where the slope is 0.
                    Newton's method {newton_method}
                Second derivative {deriv2} [<r d/dx>]
                  Hessian {hessian}
                  Fractional derivative {fractional_deriv}
                Partial derivative {partial}
                  Nabla {nabla}
                    Gradient {gradient}
                      Divergence {divergence}
                        Curl {curl}
                          Laplacian {laplacian}
                            Nabla squared {nabla_sq}
                              d'Alembertian {dalembertian}
                    Material derivative {material_deriv}
                Differential equations {diffeq}
                  Euler's method {euler_method}
                  Airy function {airy}
                  Bessel functions {bessel}
                  Chaos theory {chaos}
                    Lorenz attractor {lorenz}
                Calculus of variations {variation}
                Calculus {calculus}
                Taylor series {taylor}
                  «Σaₙxⁿ» Power series — An infinitely long polynomial.
                    Generating functions {generating_fn}
            Weierstrass function {weierstrass}
      «→ ∞» Divergence of a series — When a series grows forever.
      Fourier series {fourier_series}
        Fourier transform {fourier}
          Hilbert transform {hilbert_t}
    Integral {integral} [<s<s+>>]
      «▥» Riemann sums — Adding up thin rectangles under a curve.
        Trapezoidal and Simpson's rules {trapezoid_rule}
        «∫ₐᵇ» Definite integral — The area under a curve between a and b.
          Fundamental theorem of calculus {ftc}
            «∫+C» Indefinite integral — The antiderivative, plus a constant C.
              «∫u dv» Integration by parts — ∫u dv = uv − ∫v du.
              «u =» Substitution — Change the variable to make an integral simpler.
          «∫^∞» Improper integrals — Integrals that stretch out to infinity.
            Gabriel's horn {gabriel}
        Lebesgue integral {lebesgue}
          Measure theory {measure}
            Banach–Tarski paradox {banach_tarski}
      Double integral {double_int} [<r∫>]
        Triple integral {triple_int}
          Surface integral {surface_int}
            Contour integral {contour}
        «⟲» Volume of revolution — Spin a curve around an axis to make a solid.
      «ℱ» Integral transforms — Turn a function into a new one with an integral.
        Laplace transform {laplace_t}
          Z-transform {z_transform}
        Mellin transform {mellin}
        Radon transform {radon}
        Convolution {convolution}
  «<>» Comparisons — Saying which is bigger, smaller or the same.
    Equals sign {eq} [=]
      Not equal to {neq}
      Approximately equal {approx}
        Asymptotic {approx_tilde}
      Identical to {equiv}
        Defined as {defined}
      Balancing both sides {fact_equal_sides}
        Equations {equation}
          Simultaneous equations {sim_equations}
          Variables {variable}
            Letters stand for numbers {fact_x_variable}
              Algebra {algebra}
                The word algebra {fact_algebra_word}
                «k» Constants — Numbers that don't change, like 5 or π.
                «3x» Coefficients — The number in front of a letter: the 3 in 3x.
                  «+ −» Terms — The parts of an expression between the + and − signs.
                    «3x+2» Expressions — Mixtures of numbers and letters, like 3x + 2.
                      «A=lw» Formulas — Rules written with letters, like A = length × width.
                Order of operations {order}
                  Parentheses {paren}
                    BODMAS and PEMDAS {fact_order}
                «y» y — The usual second unknown, and the up-and-down axis on a graph.
                «z» z — The third unknown, and the third axis in 3-D.
                «a,b,c» a, b and c — Letters often used for numbers we know.
                Functions {function}
                  «x ↦ y» Domain and range — The inputs a function takes, and the outputs it gives.
                    Maps to {mapsto}
                  Linear function {linear}
                    «b» y-intercept — Where a line crosses the y-axis.
                    Quadratic function {quadratic}
                      Parabola {parabola}
                        «∪» Vertex — The very tip of a parabola.
                      «−b±√» Quadratic formula — x = (−b ± √(b² − 4ac)) ÷ 2a.
                        Plus or minus {pm}
                          Minus or plus {mp}
                        «b²−4ac» Discriminant — Tells you how many solutions a quadratic has.
                      «(x+a)²» Completing the square — Rewriting x² + bx as a square plus a number.
                      Cubic function {cubic}
                        Polynomial {polynomial}
                          «xⁿ» Degree of a polynomial — The highest power in a polynomial.
                          «f(x)=0» Roots — The x values where a function equals zero.
                            Fundamental theorem of algebra {fta_algebra}
                              Galois theory {galois}
                                Groups {group}
                                  Symmetry {symmetry}
                                  Rubik's cube group {rubik}
                                  Rings and fields {ring}
                                    Category theory {category}
                          Rational function {rational_fn}
                          Legendre polynomials {legendre_poly}
                          Chebyshev polynomials {chebyshev}
                          Hermite polynomials {hermite}
                          Hypergeometric function {hypergeometric}
                  Power function {power_fn}
                  Inverse function {inverse}
                    Inverse symbol {inverse_sym}
                    Injective, surjective, bijective {bijection}
                  Composite function {composite_fn}
                    Composition {compose}
                  Identity function {identity_fn}
                    Constant function {constant_fn}
                  Piecewise function {piecewise}
                    Heaviside step function {heaviside}
                      Dirac delta {dirac}
                    Indicator function {characteristic_fn}
                      Dirichlet function {dirichlet_fn}
                        Thomae's function {thomae}
                  «⌊ ⌉» Rounding functions — Functions that turn decimals into whole numbers.
                    Floor function {floor}
                      Ceiling function {ceil}
                      Integer part {floor_op}
                      Fractional part {frac_part}
                        Sawtooth wave {sawtooth}
                    Sign function {sign}
                  Even and odd functions {even_odd_fn}
                    Periodic function {periodic}
                      «∿» Waves — Repeating up-and-down patterns.
                        Square wave {square_wave}
                        Triangle wave {triangle_wave}
                        Sinc function {sinc}
                  Recursive function {recursion}
                    Sequence {sequence}
                      Fibonacci numbers {fibonacci}
                        Lucas numbers {lucas}
                        Keith numbers {keith}
                        Fibonacci in plants {fact_fib_nature}
                    Tower of Hanoi {hanoi}
                    Fractals {fractal}
                      Koch snowflake {koch}
                      Cantor set {cantor_set}
                        Cantor function {cantor_fn}
                        Menger sponge {menger}
                      Space-filling curves {space_filling}
                        Hilbert curve {hilbert_curve}
                      Coastline paradox {coastline}
                  «Γ ζ J» Special functions — Famous functions with their own names.
                    Lambert W function {lambert}
                    Elliptic functions {elliptic_fn}
                    Gudermannian function {gudermannian}
          Inequalities {inequality}
    Less than {lt}
      Less than or equal to {le}
      Much less than {muchless}
      «1<2<3» Ordering — Putting numbers from smallest to largest.
        «min» Minimum — The smallest value in a list.
        «max» Maximum — The biggest value in a list.
    Greater than {gt}
      Greater than or equal to {ge}
      Much greater than {muchgreater}
  «△» Geometry — The maths of shapes, sizes and space.
    «•» Dots — Points: exact places with no size.
      «—» Lines — Straight paths that go on forever in both directions.
        «→» Rays — Lines that start at a point and go one way forever.
          Angles {angle}
            Degree {deg}
              A full turn is 360° {fact_circle_360}
              Radians {radian}
                Radians make calculus simpler {fact_circle_degrees}
            Angle symbol {anglesym}
            «◠» Protractor — The tool for measuring angles.
            Types of angles {angle_types}
              «∠<90°» Acute angles — Less than 90°.
                «90°» Complementary angles — Two angles that add to 90°.
              «∟» Right angles — Exactly 90°.
                Perpendicular {perp}
              «∠>90°» Obtuse angles — Between 90° and 180°.
                «180°» Straight angles — Exactly 180°.
                  «180°» Supplementary angles — Two angles that add to 180°.
                  «>180°» Reflex angles — More than 180°.
            «✕» Vertically opposite angles — The equal angles across two crossing lines.
            Polygons {polygon}
              Triangle {triangle}
                Angles add to 180° {fact_triangle_angles}
                  Non-Euclidean geometry {hyperbolic_geom}
                Types of triangles {triangle_types}
                  «▲» Equilateral triangle — All three sides equal.
                  «△» Isosceles triangle — Two sides equal.
                  «◺» Scalene triangle — No sides equal.
                Congruent {congruent}
                  Similar {similar}
                «◣» Right triangle — A triangle with a 90° angle.
                  «c» Hypotenuse — The longest side, opposite the right angle.
                    Pythagorean theorem {pythag}
                      Pythagorean triples {pyth_triples}
                      «√(Δx²+Δy²)» Distance formula — Pythagoras on a grid.
                        Metric spaces {metric_space}
                  Trigonometry {trig}
                    SOH CAH TOA {sohcahtoa}
                      Sine {sin}
                        Cosecant {csc}
                        Inverse sine {arcsin}
                        Cosine {cos}
                          Secant {sec}
                          Inverse cosine {arccos}
                          Tangent {tan}
                            Cotangent {cot}
                            Inverse tangent {arctan}
                    Theta {theta}
                    Unit circle {unit_circle}
                      Hyperbolic sine {sinh}
                        Hyperbolic cosine {cosh}
                          Hyperbolic tangent {tanh}
                            Inverse hyperbolic functions {arsinh}
                    Law of sines and cosines {law_sines}
                Missing square puzzle {missing_square}
                  Hooper's paradox {hooper}
              Quadrilaterals {quadrilateral}
                Angles add to 360° {fact_quad_angles}
                «▱» Parallelogram — Two pairs of parallel sides.
                  «▬» Rectangle — 4 right angles; opposite sides equal.
                    «■» Square — 4 equal sides and 4 right angles.
                  «◆» Rhombus — 4 equal sides.
                «⏢» Trapezoid — One pair of parallel sides.
                «◇» Kite — Two pairs of equal sides next to each other.
              «⬠» Pentagon — 5 sides.
                «⬡» Hexagon — 6 sides. Honeycombs are made of them.
                  «7» Heptagon — 7 sides.
                    «⯃» Octagon — 8 sides, like a stop sign.
                      «10» Decagon — 10 sides.
              «⬢» Regular polygons — Every side and every angle equal.
                «a» Apothem — From the centre straight to the middle of a side.
                Tessellations {tessellation}
                  Penrose tiling {penrose}
                Circle {circle}
                  «r» Radius — From the centre to the edge.
                    «d» Diameter — Straight across through the centre: two radiuses.
                      «C» Circumference — The distance all the way around: 2πr.
                        Pi {pi}
                  Parts of a circle {circle_parts}
                    Arc {arc}
                    «⌓» Chord — A line joining two points on a circle.
                    «◔» Sector — A pizza-slice part of a circle.
                    «⊙—» Tangent line — A line that touches a circle at exactly one point.
                  «⬯» Ovals — Egg shapes and stretched circles.
                    Ellipse {ellipse}
                      Conic sections {conic}
                        Parabola {parabola}
                        Hyperbola {hyperbola}
                  Sphere {sphere}
                    Sphere packing {sphere_packing}
                      Kissing number {kissing}
                  Cylinder {cylinder}
                    Cone {cone}
              «⬟» Convex and concave — Shapes that bulge outward, or cave inward.
                «✦» Irregular shapes — Shapes whose sides and angles aren't all equal.
                  «★» Star — A shape with points, made by a concave polygon.
        «•—•» Line segments — Pieces of a line with two ends.
          «ℓ» Length — How long something is.
            «📏» Measurement — Finding sizes.
              «h» Height — How tall something is.
              «w» Width — How wide something is.
                «d» Depth — How deep something is.
            «∥ ∥» Same length — Equal lengths, marked with matching little ticks.
          «M» Midpoint — The point exactly halfway along.
        Parallel {parallel}
        «✕» Intersections — Where lines cross each other.
        Points, lines and rays {line_ray}
        Cartesian coordinates {coords}
          «📈» 2-D graphs — Plotting points using x and y.
            «🧊» 3-D graphs — Adding a third axis, z.
              Dimensions {dimension}
                «3D» 3-D — Length, width and height.
                  «⬛» 3-D shapes — Solid shapes that take up space.
                    «▣» Cube — 6 square faces.
                      «▭» Cuboid — A box shape with rectangle faces.
                        Prism {prism}
                    Pyramid {pyramid}
                    «✚» Nets — Flat patterns that fold up into a solid.
                    «⬢» Convex solids — Solids with no dents or holes.
                      Platonic solids {platonic}
                        «4» Tetrahedron — 4 triangle faces.
                        «8» Octahedron — 8 triangle faces.
                        «12» Dodecahedron — 12 pentagon faces.
                        «20» Icosahedron — 20 triangle faces.
                        «V E F» Faces, edges and vertices — The flat sides, the lines and the corners of a solid.
                          Euler characteristic {euler_char}
                            Topology {topology}
                              Torus {torus}
                                Möbius strip {mobius}
                                  Klein bottle {klein}
                              Knot theory {knot}
                              Manifolds {manifold}
                                Poincaré conjecture {poincare}
                              Hairy ball theorem {hairy_ball}
                              Brouwer fixed-point theorem {brouwer}
                              Ham sandwich theorem {ham_sandwich}
                              Sphere eversion {smale}
                  Fourth dimension {four_dim}
                    Tesseract {tesseract}
                      «nD» Nth dimensions — Spaces with any number of directions.
                        Vectors {vector}
                          Adding vectors {vectors_add}
                          Unit vectors {hat}
                          Vector arrow {vecarrow}
                          Linear algebra {linear_algebra}
                            Direct sum {directsum}
                            Outer product {outer_product}
                        Hilbert space {hilbert_space}
          Polar coordinates {polar}
        Transformations {transformations}
          «→» Translation — Sliding a shape.
          «↻» Rotation — Turning a shape.
          «⇋» Reflection — Flipping a shape in a mirror line.
            Symmetry {symmetry}
          «⤢» Enlargement — Making a shape bigger or smaller.
      «⊙» Constructions — Drawing exact shapes with tools.
        Compass and straightedge {compass_straightedge}
          Origami mathematics {origami}
  Sets {set}
    Element of {elem}
      Not an element of {notelem}
    Empty set {empty}
    Subset {subset}
      Proper subset {proper_subset}
        Not a subset {not_subset}
      Superset {superset}
      Power set {powerset}
        Cardinality {hash}
          Aleph-null {aleph}
    Union {union}
      Big union {bigunion}
      Intersection {inter}
        Big intersection {biginter}
        «◯◯» Venn diagrams — Overlapping circles that show how sets share members.
          Set difference {setminus}
            Complement {complement}
            Symmetric difference {symdiff}
          Inclusion–exclusion {inclusion_exclusion}
    Cartesian product {cartesian}
    Russell's paradox {russell}
      Barber paradox {barber}
      ZFC set theory {zfc}
        Axiom of choice {choice}
          Banach–Tarski paradox {banach_tarski}
            Hausdorff paradox {hausdorff}
        Continuum hypothesis {continuum_hyp}
          Skolem's paradox {skolem}
    «ℕℤℚℝℂ» Number sets — The families of numbers, each inside the next.
      Natural numbers {naturals}
        Integers {integers}
          Rational numbers {rationals}
            Real numbers {reals}
              Complex numbers {complexes}
                Quaternions {quaternions_set}
      Set of primes {primes_set}
    Logic {logic}
      Logical not {not}
        True {truesym}
      Logical and {and}
        Logical or {or}
          Exclusive or {xor}
      Implies {implies}
        Is implied by {leftarrow}
          If and only if {iff}
            iff {iff_short}
      For all {forall}
        There exists {exists}
          There does not exist {nexists}
      Therefore {therefore}
        Because {because}
      Proves {proves}
        Models {models}
      «⁉» Paradoxes — Puzzles where good reasoning seems to break.
        Liar paradox {liar}
          Pinocchio paradox {pinocchio}
          Card paradox {jourdain}
          Quine's paradox {quine_par}
            Yablo's paradox {yablo}
          Grelling–Nelson paradox {grelling}
          Curry's paradox {curry}
          Berry paradox {berry}
            Richard's paradox {richard}
        @group par
  Graph theory {graph_theory}
    Seven bridges of Königsberg {konigsberg}
      Euler paths {euler_path}
        Trees {tree_graph}
          Planar graphs {planar}
            Four colour theorem {four_color}
    Shortest path {shortest_path}
      Travelling salesman problem {tsp}
      Braess's paradox {braess}
    Erdős number {erdos_number}
    Game theory {game_theory}
      Prisoner's dilemma {prisoners}
        Nash equilibrium {nash}
          Zero-sum games {zero_sum}
      Newcomb's paradox {newcomb}
    «?» Probability puzzles — Questions where the answer surprises people.
      Monty Hall problem {monty_hall}
        Bertrand's box paradox {bertrand_box}
          Boy or girl paradox {boy_girl}
      Birthday paradox {birthday}
      Penney's game {penney}
        Nontransitive dice {nontransitive_dice}
      Gambler's fallacy {gambler}
      Infinite monkey theorem {infinite_monkey}
  «🧩» Puzzles and games — Mathematical fun.
    Magic squares {magic_square}
      Latin squares and Sudoku {latin_square}
    Missing dollar riddle {missing_dollar}
    Happy numbers {happy}
      Narcissistic numbers {narcissistic}
        Automorphic numbers {automorphic}
          Kaprekar numbers {kaprekar_num}
    Palindromic numbers {palindromic}
      Lychrel numbers {lychrel}
      Repunits {repunit}
        111,111,111² {fact_111}
    Interesting number paradox {interesting}
  «🏆» Famous problems — Big questions, some still unsolved.
    Hilbert's problems {hilbert_problems}
      Millennium Prize Problems {millennium}
    Twin prime conjecture {twin_prime}
    Collatz conjecture {collatz}
  «🛒» Everyday maths — Maths you use every day.
    Money and interest {money_math}
    Dozen and gross {fact_dozen}
  «💡» Facts — Handy things to know.
    @group fact
  «★» Everything else in the Math Book — Entries that aren't on a branch above yet.
    @group sym
    @group op
    @group fn
    @group nt
    @group oth
`;
