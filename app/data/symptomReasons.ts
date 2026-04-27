// app/data/symptomReasons.ts

/*
    This file contains the contextual reasoning engine for CycleSense insights.
    
    The getSymptomReason function takes in a symptom name along with contextual
    data about the user's current state, and returns a personalised plain-English
    explanation for why they may be experiencing that symptom right now.

    Priority order for reasoning:
    1. Phase + bleeding level (strongest hormonal signal)
    2. Co-occurring symptoms (pattern matching)
    3. Logged activities (lifestyle factors)
    4. Intensity (severity context)
    5. General hormonal fallback (always present)
*/

type Phase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";
type BleedingLevel = "None" | "Light" | "Medium" | "Heavy";

export function getSymptomReason(
    symptomName: string,
    phase: Phase,
    bleeding: BleedingLevel,
    otherSymptoms: string[],
    intensity: number | undefined,
    cycleDay: number
): string {

    const has = (s: string) => otherSymptoms.map(x => x.toLowerCase()).includes(s.toLowerCase());
    const hasAny = (...symptoms: string[]) => symptoms.some(s => has(s));
    const isHighIntensity = intensity !== undefined && intensity >= 4;
    const isMediumIntensity = intensity !== undefined && intensity === 3;
    const isHeavyBleeding = bleeding === "Heavy";
    const isMediumBleeding = bleeding === "Medium";

    // Activities
    const hasActivity = hasAny("Running", "Cardio", "Dancing", "Weights", "Yoga", "Walking");
    const hasIntenseActivity = hasAny("Running", "Cardio", "Dancing");
    const hasWeights = has("Weights");

    // Digestive symptoms
    const hasDigestiveSymptoms = hasAny("Bloating", "Gas", "Constipation", "Diarrhoea", "Nausea");
    const hasCravings = hasAny("Chocolate cravings", "Salty cravings", "Increased appetite");
    const hasMoodSymptoms = hasAny("Low mood", "Anxious", "Irritable", "Mood swings", "Emotional");
    const hasSleepIssues = hasAny("Insomnia", "Sleep Disruption");

    const name = symptomName.toLowerCase();

    // ── CRAMPS ────────────────────────────────────────────────────────────────
    if (name === "cramps") {
        if (phase === "Menstrual") {
            let reason = "Your body is releasing chemicals called prostaglandins to help shed the uterine lining - these cause your uterus to contract, which is what's behind those cramps.";
            if (isHeavyBleeding) reason += " Your heavy bleeding today suggests high prostaglandin levels, which can make cramping more intense.";
            else if (isMediumBleeding) reason += " This is very common with medium bleeding as the uterus works to expel the lining.";
            if (has("Back pain")) reason += " The pain in your back is likely referred pain from the same uterine contractions - they share nerve pathways.";
            if (has("Nausea")) reason += " The nausea you're also feeling is another sign that prostaglandin levels are particularly high right now.";
            if (has("Diarrhoea")) reason += " Prostaglandins can also stimulate your intestines, which explains the diarrhoea.";
            if (isHighIntensity) reason += " At this intensity, it may be worth taking an anti-inflammatory like ibuprofen, which specifically targets prostaglandins.";
            return reason;
        }
        if (phase === "Ovulation") {
            return "This is likely ovulation pain (sometimes called Mittelschmerz), caused by the follicle rupturing to release an egg. It's usually one-sided and short-lived - completely normal." + (isHighIntensity ? " If the pain is severe or lasts more than a day or two, it's worth checking in with a doctor." : "");
        }
        if (phase === "Luteal") {
            let reason = "In the luteal phase, rising prostaglandins as your body prepares for menstruation can cause mild cramping - this is a sign your period may be approaching soon.";
            if (has("Bloating")) reason += " The bloating you're also experiencing is likely part of the same hormonal shift.";
            return reason;
        }
        if (phase === "Follicular") {
            return "Cramping in the follicular phase is less common but can happen as the uterus finishes expelling any remaining lining from your last period. It should ease off as the phase progresses.";
        }
    }

    // ── HEADACHE ──────────────────────────────────────────────────────────────
    if (name === "headache") {
        const reasons: string[] = [];

        if (hasIntenseActivity) {
            reasons.push("You've been active today - sweating during exercise can cause dehydration, which is one of the most common triggers for headaches. Make sure you're drinking enough water.");
        }
        if (phase === "Menstrual") {
            reasons.push("Your oestrogen levels drop sharply at the start of your period, which is a well-known headache trigger - some people are particularly sensitive to this hormonal shift.");
            if (isHeavyBleeding) reasons.push("Heavy bleeding can also lower blood pressure and reduce iron levels, both of which can contribute to head pain.");
        }
        if (phase === "Luteal") {
            reasons.push("As oestrogen and progesterone start to fall in the lead-up to your period, this hormonal dip is a common headache trigger.");
        }
        if (phase === "Ovulation") {
            reasons.push("The oestrogen peak at ovulation can trigger headaches in some people, particularly those prone to hormonal headaches.");
        }
        if (has("Nausea") && has("Cramps")) {
            reasons.push("The combination of headache, nausea, and cramps together suggests this may be a period headache - they often occur together when prostaglandin levels are high.");
        } else if (has("Nausea")) {
            reasons.push("The nausea alongside your headache may suggest this is migraine-like in nature - hormonal migraines often present with both symptoms.");
        }
        if (hasSleepIssues) {
            reasons.push("Poor sleep is also a major headache trigger, and you've logged sleep issues - the two are likely compounding each other.");
        }

        if (reasons.length === 0) {
            return "Headaches during your cycle are usually triggered by hormonal fluctuations - oestrogen levels shift throughout all phases and some people are particularly sensitive to these changes. Dehydration, skipped meals, and poor sleep can all make them worse.";
        }
        return reasons.join(" ");
    }

    // ── MIGRAINE ──────────────────────────────────────────────────────────────
    if (name === "migraine") {
        let reason = "";
        if (phase === "Menstrual") {
            reason = "Menstrual migraines are primarily triggered by the sharp drop in oestrogen that occurs when your period starts - this is one of the most common migraine triggers for people who menstruate.";
            if (isHeavyBleeding) reason += " Heavy bleeding intensifies this hormonal drop, which may be why this migraine is particularly bad.";
        } else if (phase === "Luteal") {
            reason = "The gradual decline in oestrogen and progesterone in the late luteal phase can trigger migraines as your body prepares for menstruation.";
        } else if (phase === "Ovulation") {
            reason = "The oestrogen peak at ovulation can paradoxically trigger migraines in some people - the rapid hormone surge is the likely culprit.";
        } else {
            reason = "Although less common in the follicular phase, any hormonal fluctuation can trigger migraines in sensitive individuals.";
        }
        if (hasIntenseActivity) reason += " Exercise-related dehydration may also be contributing - make sure you're well hydrated.";
        if (has("Nausea")) reason += " The nausea you're also experiencing is very typical of hormonal migraines.";
        if (isHighIntensity) reason += " At this severity, rest in a dark quiet room and consider migraine-specific medication if you have it.";
        return reason;
    }

    // ── BACK PAIN ─────────────────────────────────────────────────────────────
    if (name === "back pain") {
        if (phase === "Menstrual") {
            let reason = "Your lower back pain is most likely referred pain from your uterine contractions - the uterus and lower back share nerve pathways, so cramping pain often radiates through.";
            if (has("Cramps")) reason += " The cramps you've also logged confirm this - they're coming from the same source.";
            if (isHeavyBleeding) reason += " Heavy bleeding tends to mean stronger contractions, which can intensify referred back pain.";
            if (hasWeights) reason += " Strength training can also put additional strain on the lower back, which may be compounding the hormonal pain today.";
            return reason;
        }
        if (phase === "Luteal") {
            let reason = "In the luteal phase, water retention caused by progesterone can put extra pressure on your back and joints.";
            if (has("Bloating")) reason += " The bloating you're also feeling is part of the same fluid retention - both are driven by progesterone.";
            if (hasWeights) reason += " Weights today may also have contributed - your muscles and joints can be more vulnerable to strain when inflammation levels are higher.";
            return reason;
        }
        if (hasWeights || hasIntenseActivity) {
            return "Your back pain today may be exercise-related - strength training and high-intensity cardio put significant load on the back, especially if form breaks down when fatigued. That said, hormonal inflammation during your cycle can make existing muscle soreness feel worse.";
        }
        return "Back pain during your cycle is often caused by uterine contractions that refer pain through shared nerve pathways, or by water retention adding pressure to the lower back and joints. It tends to be most noticeable during the menstrual and late luteal phases.";
    }

    // ── EXHAUSTED ─────────────────────────────────────────────────────────────
    if (name === "exhausted") {
        const reasons: string[] = [];
        if (phase === "Menstrual") {
            reasons.push("Fatigue during your period is extremely common - your body is doing significant work shedding the uterine lining, and hormone levels (particularly oestrogen) are at their lowest.");
            if (isHeavyBleeding) reasons.push("Heavy bleeding also means your body is losing iron-rich blood, which directly reduces your energy levels. Iron is essential for carrying oxygen around the body.");
        }
        if (phase === "Luteal") {
            reasons.push("Progesterone has a sedating effect on the body, which is why the luteal phase often comes with a noticeable dip in energy - especially in the second half.");
        }
        if (hasSleepIssues) {
            reasons.push("You've also logged sleep issues, which will be compounding your fatigue significantly - poor sleep and hormonal tiredness stack on top of each other.");
        }
        if (has("Low mood") || has("Anxious")) {
            reasons.push("Emotional strain from the mood symptoms you're tracking takes real energy - mental exhaustion and physical fatigue often feed into each other.");
        }
        if (hasIntenseActivity) {
            reasons.push("Intense exercise today will also be a factor - your body needs more recovery time during hormonally demanding phases of your cycle.");
        }
        if (reasons.length === 0) {
            return "Fatigue can occur at any phase of the cycle due to hormonal fluctuations. Oestrogen tends to boost energy, so when levels dip - at the start of your period or before it - energy follows. Iron, sleep quality, and stress all play a role too.";
        }
        return reasons.join(" ");
    }

    // ── NAUSEA ────────────────────────────────────────────────────────────────
    if (name === "nausea") {
        if (phase === "Menstrual") {
            let reason = "Nausea during your period is usually caused by high prostaglandin levels - the same chemicals that cause cramping can also affect your stomach and digestive system.";
            if (has("Cramps")) reason += " The cramps you've also logged confirm that prostaglandins are high right now - nausea and cramps together are a classic combination.";
            if (has("Diarrhoea")) reason += " Diarrhoea alongside nausea reinforces this - prostaglandins are stimulating your whole digestive system.";
            if (isHeavyBleeding) reason += " Heavy bleeding can also cause blood pressure to drop slightly, which can trigger nausea in some people.";
            if (hasIntenseActivity) reason += " Exercise-related dehydration may also be contributing on top of this.";
            return reason;
        }
        if (phase === "Luteal") {
            let reason = "Progesterone slows digestion by relaxing the muscles of your digestive tract, which can cause nausea and an unsettled stomach in the luteal phase.";
            if (hasDigestiveSymptoms) reason += " The other digestive symptoms you've logged today are likely coming from the same root cause.";
            if (hasIntenseActivity) reason += " Exercise-related dehydration may also be contributing.";
            return reason;
        }
        if (hasIntenseActivity) {
            return "Intense exercise on a low or empty stomach is a common nausea trigger - your body diverts blood away from digestion during high-intensity activity. Make sure you're eating and drinking enough around your workouts.";
        }
        return "Nausea during the cycle is most often driven by prostaglandins (during menstruation) or progesterone slowing digestion (in the luteal phase). Dehydration and exercising on an empty stomach can also trigger it.";
    }

    // ── BLOATING ──────────────────────────────────────────────────────────────
    if (name === "bloating") {
        const reasons: string[] = [];
        if (phase === "Luteal" || phase === "Menstrual") {
            reasons.push(phase === "Luteal"
                ? "Progesterone relaxes the smooth muscles of your digestive tract and causes your body to retain water - both of these contribute directly to bloating."
                : "Hormonal shifts at the start of your period can cause inflammation and water retention, leading to that full, tight feeling."
            );
        }
        if (has("Constipation")) {
            reasons.push("You've also logged constipation - when food moves slowly through your digestive system, gas builds up and bloating gets significantly worse.");
        }
        if (has("Gas")) {
            reasons.push("The gas you're also experiencing shares the same root cause - slowed digestion means more fermentation and trapped air.");
        }
        if (hasCravings || has("Salty cravings")) {
            reasons.push("Salty food cravings during this phase are common, but eating more sodium causes your body to hold onto more water, which directly worsens bloating.");
        }
        if (reasons.length === 0) {
            return "Bloating is most common in the luteal phase and around menstruation, when progesterone slows digestion and hormonal shifts cause water retention. Salty foods and reduced movement can make it worse.";
        }
        return reasons.join(" ");
    }

    // ── GAS ───────────────────────────────────────────────────────────────────
    if (name === "gas") {
        let reason = "";
        if (phase === "Luteal" || phase === "Menstrual") {
            reason = "Progesterone relaxes the muscles throughout your digestive system, slowing the movement of food. When digestion slows, bacteria in your gut ferment food for longer, producing more gas.";
        } else {
            reason = "Hormonal fluctuations throughout the cycle can affect how quickly food moves through your digestive system, sometimes leading to increased gas production.";
        }
        if (has("Bloating")) reason += " This is also why you're bloated - trapped gas and slow digestion go hand in hand.";
        if (has("Constipation")) reason += " Constipation makes this worse - the longer food sits in your system, the more gas builds up.";
        if (hasCravings) reason += " Rich or sugary foods that cravings lead you to can also increase gas production.";
        return reason;
    }

    // ── CONSTIPATION ──────────────────────────────────────────────────────────
    if (name === "constipation") {
        let reason = "";
        if (phase === "Luteal" || phase === "Ovulation") {
            reason = "Progesterone is the main culprit here - it relaxes smooth muscle throughout the body, including in your digestive tract, which significantly slows the movement of food. This is why constipation is so common in the luteal phase.";
        } else if (phase === "Menstrual") {
            reason = "While diarrhoea is more common during menstruation, some people experience constipation instead, depending on how their body responds to prostaglandins and hormonal changes.";
        } else {
            reason = "Constipation can still occur in the follicular phase for some people, particularly if progesterone hasn't fully cleared from the previous cycle.";
        }
        if (has("Bloating")) reason += " The bloating you're also experiencing is a direct consequence - when waste moves slowly, gas builds up and abdominal pressure increases.";
        if (!hasActivity) reason += " Low physical activity can also slow digestion - movement stimulates the bowel, so gentle exercise like walking can help.";
        if (has("Low appetite")) reason += " Eating less than usual will also reduce the fibre and bulk your digestive system needs to move things along.";
        return reason;
    }

    // ── DIARRHOEA ─────────────────────────────────────────────────────────────
    if (name === "diarrhoea") {
        if (phase === "Menstrual") {
            let reason = "Period diarrhoea is caused by prostaglandins - the same chemicals that trigger your uterus to contract also stimulate your intestines to contract more than usual, speeding up digestion.";
            if (has("Cramps")) reason += " The cramps you're also experiencing confirm that prostaglandin levels are high right now - they're affecting both your uterus and your gut simultaneously.";
            if (has("Nausea")) reason += " Nausea alongside this is also a prostaglandin effect - your whole digestive system is being stimulated.";
            if (isHeavyBleeding) reason += " Heavy bleeding is often associated with higher prostaglandin levels, which may be why this is particularly intense.";
            return reason;
        }
        if (phase === "Luteal") {
            return "As progesterone drops and prostaglandins begin to rise in the late luteal phase, some people experience digestive changes including looser stools - your period may be approaching soon.";
        }
        return "Digestive changes including diarrhoea can occur at various points in the cycle due to hormonal fluctuations affecting gut motility. It's most common during menstruation when prostaglandins are highest.";
    }

    // ── TENDER BREASTS ────────────────────────────────────────────────────────
    if (name === "tender breasts") {
        if (phase === "Luteal") {
            let reason = "Breast tenderness in the luteal phase is driven by rising progesterone, which causes breast tissue to swell slightly in preparation for a potential pregnancy - this swelling creates that soreness and sensitivity.";
            if (has("Bloating")) reason += " The bloating you're also experiencing is part of the same progesterone-driven water retention.";
            return reason;
        }
        if (phase === "Ovulation") {
            return "The surge in oestrogen and LH around ovulation can cause temporary breast tenderness - your hormone levels are at their peak right now, which makes breast tissue more sensitive.";
        }
        if (phase === "Menstrual") {
            return "While tenderness usually peaks in the luteal phase, some people continue to feel it at the start of their period as hormone levels begin to fall. It should ease as your period progresses.";
        }
        return "Breast tenderness is most commonly caused by progesterone in the luteal phase or the oestrogen surge at ovulation - both cause breast tissue to become temporarily more sensitive.";
    }

    // ── ACNE ──────────────────────────────────────────────────────────────────
    if (name === "acne") {
        if (phase === "Luteal") {
            let reason = "Progesterone rises in the luteal phase and stimulates sebaceous glands to produce more oil (sebum). When excess oil mixes with dead skin cells, it can clog pores and cause breakouts.";
            if (has("Chocolate cravings") || has("Increased appetite")) reason += " High-sugar or high-dairy foods - which cravings may have led you towards - can also increase sebum production and inflammation, worsening breakouts.";
            return reason;
        }
        if (phase === "Menstrual") {
            return "The hormonal imbalance at the start of your period - with oestrogen and progesterone both low - can trigger breakouts. Androgen levels become relatively higher at this point, which increases oil production.";
        }
        if (phase === "Ovulation") {
            return "While oestrogen generally helps keep skin clear, the hormonal surge at ovulation can still trigger breakouts in some people, particularly around the chin and jawline.";
        }
        return "Acne throughout the cycle is largely driven by androgen hormones, which fluctuate alongside oestrogen and progesterone. Breakouts tend to peak in the luteal phase and around menstruation when oil production is highest.";
    }

    // ── JOINT PAIN ────────────────────────────────────────────────────────────
    if (name === "joint pain") {
        const reasons: string[] = [];
        if (phase === "Luteal" || phase === "Menstrual") {
            reasons.push(phase === "Luteal"
                ? "Progesterone-driven fluid retention in the luteal phase can cause swelling in and around joints, leading to stiffness and discomfort."
                : "Increased inflammation during menstruation can affect joint tissue, making them feel sore or stiff."
            );
        }
        if (hasIntenseActivity) {
            reasons.push("The high-intensity exercise you've done today puts significant load on your joints - and during hormonally active phases of your cycle, inflammation is already elevated, making joints more vulnerable to soreness.");
        }
        if (has("Bloating")) {
            reasons.push("The fluid retention behind your bloating is the same mechanism causing joint swelling - both are driven by the same hormonal water retention.");
        }
        if (reasons.length === 0) {
            return "Joint pain during the cycle is often caused by oestrogen fluctuations - oestrogen has an anti-inflammatory effect, so when it dips (during menstruation or the late luteal phase), joints can become more inflamed and sore. Exercise and fluid retention can amplify this.";
        }
        return reasons.join(" ");
    }

    // ── OVULATION PAIN ────────────────────────────────────────────────────────
    if (name === "ovulation pain") {
        let reason = "This is Mittelschmerz - a German word meaning 'middle pain'. It's caused by the follicle in your ovary rupturing to release an egg. The fluid released can briefly irritate the lining of your abdomen, causing that one-sided twinge or cramp.";
        if (phase !== "Ovulation") {
            reason += " This pain is most typical around ovulation, though the timing can vary slightly depending on your cycle length.";
        }
        if (isHighIntensity) reason += " If the pain is severe or lasts more than 48 hours, it's worth speaking to a doctor to rule out other causes.";
        return reason;
    }

    // ── INSOMNIA ──────────────────────────────────────────────────────────────
    if (name === "insomnia") {
        const reasons: string[] = [];
        if (phase === "Luteal") {
            reasons.push("Progesterone initially has a sedating effect, but as it drops sharply in the late luteal phase, this can disrupt your sleep architecture - making it harder to fall asleep or stay asleep.");
        }
        if (phase === "Menstrual") {
            reasons.push("Physical discomfort during your period - cramps, back pain, and general restlessness - can make it hard to sleep, even when you're exhausted.");
        }
        if (has("Anxious")) {
            reasons.push("The anxiety you've also logged is very likely contributing - a racing mind or feeling on edge makes it significantly harder to wind down and fall asleep.");
        }
        if (has("Cramps")) {
            reasons.push("Cramping pain is a physical barrier to sleep - it's very hard to stay comfortable enough to fall or stay asleep when you're in discomfort.");
        }
        if (hasIntenseActivity) {
            reasons.push("Intense exercise raises cortisol and core body temperature, both of which can interfere with sleep if the workout was too close to bedtime.");
        }
        if (reasons.length === 0) {
            return "Sleep is closely tied to hormones - oestrogen supports deep sleep, and progesterone has a calming effect. When either drops (as they do before your period or at menstruation), sleep quality often suffers. Stress and physical discomfort make this worse.";
        }
        return reasons.join(" ");
    }

    // ── ANXIOUS ───────────────────────────────────────────────────────────────
    if (name === "anxious") {
        const reasons: string[] = [];
        if (phase === "Luteal") {
            reasons.push("The drop in oestrogen and progesterone in the late luteal phase directly affects serotonin and GABA - two brain chemicals that regulate calm and mood. Lower levels of these can make anxiety feel much more intense.");
        }
        if (phase === "Menstrual") {
            reasons.push("Hormone levels are at their lowest during menstruation, which can leave the nervous system feeling more reactive and less able to regulate anxiety.");
        }
        if (hasSleepIssues) {
            reasons.push("Sleep deprivation significantly raises cortisol (your stress hormone), which directly amplifies feelings of anxiety - the two symptoms feed into each other.");
        }
        if (has("Mood swings") || has("Irritable")) {
            reasons.push("The mood instability you're also experiencing suggests your serotonin levels may be low right now - anxiety, irritability, and mood swings often cluster together for this reason.");
        }
        if (reasons.length === 0) {
            return "Anxiety during the cycle is closely linked to oestrogen - it plays a key role in regulating serotonin and GABA, the brain chemicals that keep anxiety in check. When oestrogen dips (particularly before your period or during menstruation), the nervous system becomes more reactive.";
        }
        return reasons.join(" ");
    }

    // ── IRRITABLE ─────────────────────────────────────────────────────────────
    if (name === "irritable") {
        const reasons: string[] = [];
        if (phase === "Luteal") {
            reasons.push("Irritability in the luteal phase is directly linked to falling oestrogen - oestrogen supports serotonin production, so as it drops, your emotional regulation becomes more fragile and your tolerance for frustration decreases.");
        }
        if (phase === "Menstrual") {
            reasons.push("With both oestrogen and progesterone at their lowest during menstruation, serotonin levels dip - this is one of the most common causes of irritability and short temper.");
        }
        if (hasSleepIssues) {
            reasons.push("Sleep deprivation is one of the strongest drivers of irritability - you've also logged sleep issues, which will be making this significantly worse.");
        }
        if (has("Exhausted")) {
            reasons.push("Exhaustion lowers your emotional resilience, making it much harder to manage frustration - the more tired you are, the shorter your fuse tends to be.");
        }
        if (has("Cramps") || has("Back pain") || has("Headache")) {
            reasons.push("Being in physical pain naturally shortens patience - chronic discomfort throughout the day depletes the mental resources needed to stay calm.");
        }
        if (reasons.length === 0) {
            return "Irritability during the cycle is primarily driven by drops in oestrogen, which reduce serotonin availability. Sleep deprivation, physical discomfort, and emotional strain all compound this effect.";
        }
        return reasons.join(" ");
    }

    // ── LOW MOOD ──────────────────────────────────────────────────────────────
    if (name === "low mood") {
        const reasons: string[] = [];
        if (phase === "Luteal") {
            reasons.push("The decline in oestrogen and progesterone in the luteal phase reduces serotonin and dopamine - two key mood-regulating chemicals. This is the hormonal basis of PMS-related low mood.");
        }
        if (phase === "Menstrual") {
            reasons.push("During menstruation, oestrogen is at its lowest point in the cycle, which directly suppresses serotonin levels - your brain's main mood stabiliser.");
        }
        if (has("Exhausted")) {
            reasons.push("The exhaustion you're also experiencing is closely linked - chronic fatigue and low mood reinforce each other, and it can be hard to tell which came first.");
        }
        if (hasSleepIssues) {
            reasons.push("Poor sleep significantly impairs mood regulation - even one or two nights of disrupted sleep can cause a noticeable dip in emotional wellbeing.");
        }
        if (!hasActivity) {
            reasons.push("Physical movement releases endorphins that directly counteract low mood - on days when you're not active, this natural mood boost is missing.");
        }
        if (isHeavyBleeding) {
            reasons.push("Heavy bleeding is physically draining, and the fatigue that comes with it can weigh on your mood too.");
        }
        if (reasons.length === 0) {
            return "Low mood during the cycle is most commonly caused by drops in oestrogen, which reduce the availability of serotonin and dopamine - your brain's mood-regulating chemicals. It tends to be most noticeable in the late luteal phase and during menstruation.";
        }
        return reasons.join(" ");
    }

    // ── MOOD SWINGS ───────────────────────────────────────────────────────────
    if (name === "mood swings") {
        let reason = "";
        if (phase === "Luteal") {
            reason = "Mood swings in the luteal phase are caused by the rapid, unpredictable fluctuations in oestrogen and progesterone - your brain's serotonin system is very sensitive to these changes, so your mood can shift quickly as hormone levels rise and fall throughout the day.";
        } else if (phase === "Menstrual") {
            reason = "With hormones at their lowest during menstruation, your emotional regulation is more fragile - small triggers can cause bigger reactions than usual.";
        } else {
            reason = "Hormonal fluctuations throughout the cycle can cause mood instability in sensitive individuals, even outside of the typical PMS window.";
        }
        if (has("Anxious") && has("Low mood")) {
            reason += " The fact that you're also feeling anxious and low today suggests your serotonin levels are quite depleted - mood swings, anxiety, and low mood together form a classic low-serotonin pattern.";
        }
        if (hasSleepIssues) reason += " Sleep deprivation significantly reduces your emotional resilience and makes mood swings harder to manage.";
        return reason;
    }

    // ── EMOTIONAL ─────────────────────────────────────────────────────────────
    if (name === "emotional") {
        let reason = "";
        if (phase === "Luteal") {
            reason = "Heightened emotional sensitivity in the luteal phase is caused by falling oestrogen, which reduces serotonin availability. With less serotonin, your brain's emotional processing becomes more reactive - things that wouldn't normally affect you as deeply can feel overwhelming.";
        } else if (phase === "Menstrual") {
            reason = "Oestrogen is at its lowest during menstruation, which dips serotonin levels and leaves you feeling more emotionally exposed than usual. This is completely normal and should ease as your period progresses.";
        } else {
            reason = "Emotional sensitivity can occur at any phase for those who are particularly responsive to hormonal changes - oestrogen fluctuations affect the brain's serotonin system throughout the entire cycle.";
        }
        if (hasMoodSymptoms) reason += " The other mood symptoms you've logged today - like anxiety, low mood, or irritability - suggest your emotional regulation is under strain right now from multiple directions.";
        return reason;
    }

    // ── LOW APPETITE ─────────────────────────────────────────────────────────
    if (name === "low appetite") {
        if (phase === "Follicular" || phase === "Ovulation") {
            let reason = "Oestrogen has a natural appetite-suppressing effect - as it rises in the follicular phase and peaks at ovulation, it's common to feel less hungry than usual. This is a well-documented hormonal pattern.";
            if (has("Nausea")) reason += " The nausea you've also logged will be making appetite worse - it's hard to feel like eating when your stomach feels unsettled.";
            return reason;
        }
        if (phase === "Menstrual") {
            let reason = "Pain, nausea, and the general physical toll of menstruation can suppress appetite even when your body needs fuel.";
            if (has("Nausea")) reason += " The nausea you're experiencing is likely the main thing putting you off food right now.";
            if (has("Cramps")) reason += " Cramping pain can also make eating feel unappealing.";
            return reason;
        }
        return "Appetite fluctuates throughout the cycle in response to oestrogen and progesterone. Oestrogen tends to suppress hunger, while progesterone tends to increase it - so low appetite is most common when oestrogen is relatively dominant.";
    }

    // ── INCREASED APPETITE ────────────────────────────────────────────────────
    if (name === "increased appetite") {
        if (phase === "Luteal") {
            let reason = "Progesterone drives increased appetite in the luteal phase - it signals to your body that it may need to prepare for pregnancy, increasing your caloric needs. Your metabolism actually runs slightly higher during this phase.";
            if (has("Chocolate cravings") || has("Salty cravings")) {
                reason += " The specific cravings you're also experiencing alongside this are driven by low serotonin (chocolate) and fluid balance changes (salt) - your body is sending you very specific hormonal signals.";
            }
            return reason;
        }
        if (phase === "Menstrual") {
            return "Your body uses extra energy during menstruation to manage blood loss and hormonal changes - increased hunger at this time is your body's way of trying to replenish those resources.";
        }
        if (hasIntenseActivity) {
            return "The exercise you've done today has increased your caloric needs - this is straightforward energy demand from activity. That said, hormonal phase can also affect hunger, and the two effects can stack.";
        }
        return "Appetite tends to increase when progesterone is dominant (luteal phase) or when the body is recovering from physical exertion. Emotional eating linked to low mood or stress can also drive increased food intake.";
    }

    // ── CHOCOLATE CRAVINGS ────────────────────────────────────────────────────
    if (name === "chocolate cravings") {
        let reason = "";
        if (phase === "Luteal" || phase === "Menstrual") {
            reason = "Chocolate cravings in the luteal phase and during menstruation are strongly linked to serotonin - as oestrogen falls, serotonin drops with it. Chocolate temporarily boosts serotonin and also contains magnesium, which many people are deficient in during this phase.";
        } else {
            reason = "While most common before and during a period, chocolate cravings can occur at any phase - they're often your body's way of seeking a quick serotonin or magnesium boost.";
        }
        if (has("Low mood") || has("Irritable")) {
            reason += " The low mood and irritability you're also experiencing reinforce the serotonin connection - your brain is craving the mood lift that chocolate provides.";
        }
        if (has("Bloating")) {
            reason += " Worth noting: the sugar in chocolate can worsen bloating, so dark chocolate with higher cocoa content is a better option if you do indulge.";
        }
        return reason;
    }

    // ── SALTY CRAVINGS ────────────────────────────────────────────────────────
    if (name === "salty cravings") {
        let reason = "";
        if (phase === "Luteal" || phase === "Menstrual") {
            reason = "Salty cravings are linked to the fluid and electrolyte changes that happen around your period. Hormonal shifts affect how your kidneys regulate sodium, which can make your body crave salt to rebalance. Aldosterone (a hormone that affects fluid retention) also fluctuates during this phase.";
        } else {
            reason = "Salty cravings can be a sign of electrolyte imbalance or mild dehydration at any point in your cycle.";
        }
        if (hasIntenseActivity) {
            reason += " You've also been active today - sweating causes significant sodium and electrolyte loss, which directly drives salt cravings as your body tries to replenish what it's lost.";
        }
        if (has("Bloating")) {
            reason += " Be mindful that eating more salt will worsen the bloating you're already experiencing - it causes your body to retain even more water.";
        }
        return reason;
    }

    // ── LOW ENERGY ────────────────────────────────────────────────────────────
    if (name === "low") {
        const reasons: string[] = [];
        if (phase === "Menstrual") {
            reasons.push("Energy is naturally at its lowest during menstruation - oestrogen is at its lowest point in the cycle, blood loss is occurring, and your body is doing significant internal work.");
            if (isHeavyBleeding) reasons.push("Heavy bleeding compounds this by reducing your iron levels, which directly affects how efficiently your body carries oxygen to your cells.");
        }
        if (phase === "Luteal") {
            reasons.push("Progesterone has a naturally sedating effect in the luteal phase, causing that characteristic drop in energy that many people notice in the week before their period.");
        }
        if (hasSleepIssues) reasons.push("Poor sleep is significantly depleting your energy - this is compounding whatever hormonal fatigue you're already experiencing.");
        if (has("Low mood")) reasons.push("Low mood and low energy are closely connected - both are driven by the same serotonin and dopamine dips, and each makes the other feel worse.");
        if (hasIntenseActivity) reasons.push("High-intensity exercise today will also have depleted your energy reserves, especially if you're already in a low-energy phase of your cycle.");
        if (reasons.length === 0) {
            return "Energy levels fluctuate significantly throughout the cycle. They tend to be highest around ovulation when oestrogen peaks, and lowest during menstruation and the late luteal phase. Iron, sleep, and stress all play a significant role too.";
        }
        return reasons.join(" ");
    }

    // ── DEFAULT FALLBACK ──────────────────────────────────────────────────────
    const fallbacks: Record<string, string> = {
        "anxious": "Anxiety during the cycle is closely linked to oestrogen fluctuations - oestrogen regulates serotonin and GABA, the brain chemicals that keep anxiety in check. When oestrogen dips, the nervous system becomes more reactive.",
        "irritable": "Irritability is most commonly driven by drops in oestrogen reducing serotonin availability. Sleep deprivation and physical discomfort both amplify this.",
        "low mood": "Low mood during the cycle is caused by dips in oestrogen reducing serotonin and dopamine - your mood-regulating chemicals. It tends to be most noticeable in the luteal phase and during menstruation.",
        "mood swings": "Mood swings are caused by rapid fluctuations in oestrogen and progesterone, which affect serotonin levels throughout the day. They are most common in the luteal phase.",
        "emotional": "Emotional sensitivity is heightened when oestrogen is low, reducing serotonin availability and making emotional responses more intense than usual.",
        "exhausted": "Fatigue is driven by hormonal fluctuations, particularly low oestrogen during menstruation and the sedating effect of progesterone in the luteal phase.",
        "cramps": "Cramps are caused by prostaglandins triggering uterine contractions to shed the lining. They are most intense during menstruation but can also occur around ovulation.",
        "headache": "Headaches during the cycle are most often triggered by oestrogen fluctuations. They tend to peak when oestrogen drops sharply - at the start of a period or just before it.",
        "migraine": "Hormonal migraines are triggered by the sharp drop in oestrogen before or at the start of menstruation. They are one of the most common cycle-related symptoms.",
        "back pain": "Back pain is most often referred pain from uterine contractions during menstruation, or caused by fluid retention putting pressure on the lower back in the luteal phase.",
        "bloating": "Bloating is driven by progesterone slowing digestion and causing water retention. It tends to peak in the luteal phase and around menstruation.",
        "nausea": "Nausea is most commonly caused by prostaglandins during menstruation or progesterone slowing digestion in the luteal phase.",
        "acne": "Breakouts are driven by androgen hormones stimulating oil production - this is highest in the luteal phase and during menstruation when sebaceous glands are most active.",
        "tender breasts": "Breast tenderness is primarily caused by progesterone-driven swelling of breast tissue in the luteal phase, or by the oestrogen surge at ovulation.",
        "insomnia": "Sleep quality is tightly linked to hormones - oestrogen supports deep sleep and progesterone has a calming effect. When either drops, sleep often suffers.",
        "joint pain": "Joint pain during the cycle is caused by oestrogen's anti-inflammatory effect dropping, combined with progesterone-driven fluid retention around joints.",
        "constipation": "Constipation is caused by progesterone relaxing the smooth muscle of your digestive tract, slowing the movement of food through your gut.",
        "gas": "Gas is caused by slow digestion - progesterone relaxes the digestive tract, allowing more time for gut bacteria to ferment food and produce gas.",
        "diarrhoea": "Diarrhoea during your period is caused by prostaglandins - the same chemicals that contract the uterus also stimulate the intestines.",
        "low appetite": "Appetite is suppressed when oestrogen is dominant, as it has a natural appetite-reducing effect. This is most noticeable in the follicular phase and around ovulation.",
        "increased appetite": "Progesterone drives increased appetite in the luteal phase by raising your metabolic rate slightly and signalling to your body that it may need extra energy.",
        "chocolate cravings": "Chocolate cravings are driven by falling serotonin - your brain craves the temporary serotonin and magnesium boost that chocolate provides, especially before your period.",
        "salty cravings": "Salty cravings are linked to hormonal effects on fluid and electrolyte balance, particularly around menstruation when aldosterone fluctuates and sodium regulation shifts.",
        "ovulation pain": "Ovulation pain (Mittelschmerz) is caused by the follicle rupturing to release an egg - the fluid released can briefly irritate the abdominal lining.",
        "low": "Energy levels follow your hormonal cycle - peaking around ovulation with high oestrogen, and dipping during menstruation and the late luteal phase with progesterone's sedating effect.",
    };

    return fallbacks[name] ?? "This symptom can be influenced by hormonal fluctuations throughout your cycle. Tracking it over time will help CycleSense identify patterns specific to you.";
}