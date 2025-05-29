function renderScatterPlot(playerData, globalZMin, globalZMax) {
    const svgWidth = 1500;
    const svgHeight = 600;
    const margin = { top: 50, right: 170, bottom: 80, left: 120 };
    const { top, right, bottom, left } = margin;
    const width = svgWidth - left - right;
    const height = svgHeight - top - bottom;

    d3.select("#chart-area").select("svg").remove();

    const svg = d3.select("#chart-area")
        .append("svg")
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${left},${top})`);
    const clipId = "scatter-clip";
    const clipPadding = 20;

    svg.append("defs")
        .append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("x", -clipPadding)
        .attr("y", -clipPadding)
        .attr("width", width + 2 * clipPadding)
        .attr("height", height + 2 * clipPadding);
    const zoomLayer = svg.append("g").attr("class", "zoom-layer");

    const maxWageRaw = d3.max(playerData, d => d["Annual Wages million"]);
    const isAllData = playerData.length > 150;
    const maxWage = isAllData ? Math.max(25, maxWageRaw) : Math.max(5, maxWageRaw);


    const xScale = isAllData
        ? d3.scaleLinear()
            .domain([0, 10, 26])
            .range([0, width * 0.75, width])
        : d3.scaleLinear()
            .domain([0, maxWage])
            .range([0, width]);

    const yScale = isAllData
        ? d3.scaleLinear()
            .domain([0, 60, 100])
            .range([height, height * 0.1, 0])
        : d3.scaleLinear()
            .domain([0, 40, 100])
            .range([height, height * 0.4, 0]);

    const positiveColorScale = d3.scaleLinear()
        .domain([0, globalZMax])
        .range(["#cce5ff", "#004080"]);

    const negativeColorScale = d3.scaleLinear()
        .domain([0, globalZMin])
        .range(["#ffcccc", "#800000"]);
    
    zoomLayer.attr("clip-path", `url(#${clipId})`);

    // zoom 정의
    const zoom = d3.zoom()
        .scaleExtent([1, 40])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    d3.select("#chart-area svg").call(zoom);

    function zoomed(event) {
        const transform = event.transform;
        const newX = transform.rescaleX(xScale);
        const newY = transform.rescaleY(yScale);
        const baseRadius = 6;
        zoomLayer.selectAll("circle")
            .attr("cx", d => newX(d["Annual Wages million"]))
            .attr("cy", d => newY(d["score_100"]))
            .attr("r",  Math.max(3, Math.min(baseRadius * transform.k, 10)));

        svg.select(".x-axis")
            .call(d3.axisBottom(newX)
                .ticks(8)
                .tickFormat(d => `${d}M`)
            )
            .selectAll("text")
            .style("font-size", "20px")
            .style("font-weight", "bold");

        svg.select(".y-axis")
            .call(d3.axisLeft(newY)
                .ticks(8)
                .tickFormat(d => `${d}`)
            )
            .selectAll("text")
            .style("font-size", "20px")
            .style("font-weight", "bold");

        
        zoomLayer.select(".y-grid")
        .call(d3.axisLeft(newY)
            .tickSize(-width)
            .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.5);


        const updatedCurve = d3.line()
            .x(d => newX(d.x))
            .y(d => newY(d.y));

        zoomLayer.select(".quadratic-curve")
            .attr("d", updatedCurve);

        zoomLayer.select(".curve-hitbox")
            .attr("d", updatedCurve);
        }
        


    const fixedTicks = [0, 1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25];
    const visibleTicks = fixedTicks.filter(d => d <= maxWage);  // ✔ maxWage 기준 필터링

    const xAxis = d3.axisBottom(xScale)
        .tickValues(visibleTicks)
        .tickFormat(d => `${d}M`);


    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    xAxisGroup.selectAll("text")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .attr("dy", "1em")

    svg.append("text")
        .attr("class", "x-axis-title")
        .attr("x", width / 2)
        .attr("y", height + bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Annual Wages (Million $)");
    const yAxis = d3.axisLeft(yScale)
        .tickValues([10, 20, 30, 40, 60, 100])
        .tickFormat(d => `${d}`);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);   

    yAxisGroup.selectAll("text")
    .style("font-size", "20px")
    .style("font-weight", "bold")

    zoomLayer.append("g")
    .attr("class", "y-grid")
    .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat("")
    )
    .selectAll("line")
    .attr("stroke", "black")
    .attr("stroke-dasharray", "4,4")
    .attr("opacity", 0.5);
    
    svg.append("defs")
    .append("linearGradient")
    .attr("id", "value-gradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%")
    .selectAll("stop")
    .data([
        { offset: "0%", color: "#800000" },
        { offset: "50%", color: "#ffffff" },
        { offset: "100%", color: "#004080" }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

    const legendHeight = 500;
    const legendWidth = 20;
    const legendX = width + 40;
    const legendY = (height - legendHeight) / 2;

    svg.append("rect")
        .attr("x", legendX + 40)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#value-gradient)")
        .attr("stroke", "#ccc");

        svg.append("text")
        .attr("x", legendX - 5)
        .attr("y", legendY - 10)
        .attr("text-anchor", "start")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Undervalued");

    svg.append("text")
        .attr("x", legendX - 5)
        .attr("y", legendY + legendHeight + 20)
        .attr("text-anchor", "start")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Overvalued");

    svg.append("text")
        .attr("class", "y-axis-title")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -left + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Contribution Score");

    zoomLayer.selectAll("circle")
        .data(playerData, d => d.Player)
        .join(
            enter => enter.append("circle")
                .attr("class", "scatter-point")
                .attr("cx", d => xScale(d["Annual Wages million"]))
                .attr("cy", d => yScale(d["score_100"]))
                .attr("r", 0)
                .attr("fill", d => d.z_score_of_distance >= 0
                    ? positiveColorScale(d.z_score_of_distance)
                    : negativeColorScale(d.z_score_of_distance))
                .attr("opacity", 0)
                .call(enter => enter.transition()
                    .duration(500)
                    .attr("r", 6)
                    .attr("opacity", 1)
                ),
            update => update.call(update => update.transition()
                .duration(500)
                .attr("cx", d => xScale(d["Annual Wages million"]))
                .attr("cy", d => yScale(d["score_100"]))
                .attr("fill", d => d.z_score_of_distance >= 0
                    ? positiveColorScale(d.z_score_of_distance)
                    : negativeColorScale(d.z_score_of_distance))
            ),
            exit => exit.call(exit => exit.transition()
                .duration(300)
                .attr("r", 0)
                .attr("opacity", 0)
                .remove()
            )
        );


    zoomLayer.selectAll(".scatter-point").each(function(d) {
        const tooltipContent = `
            <div class="tooltip-wrapper">
                <img src="${d.image || './薪资可视化图_js/smile.jpg'}" width="80" height="80" style="border-radius: 50%; margin-bottom: 6px; display: block; margin-left: auto; margin-right: auto;" />
                <div><strong>${d.Player}</strong></div>
                <div>Position: ${d.DPos}</div>
                <div>Squad: ${d.Squad}</div>
                <div>Wage: $${d["Annual Wages"].toLocaleString()}</div>
                <div>Score: ${d.score_100.toFixed(1)}</div>
            </div>
        `;

        tippy(this, {
            content: tooltipContent,
            allowHTML: true,
            theme: "light-border",
            placement: "top",
            animation: "none",
            duration: [0, 0],
            delay: [0, 0],
            inertia: false
        });
    });

    const quadraticLine = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    const xDomain = xScale.domain();
    const xMax = xDomain[xDomain.length - 1];

    const curveData = d3.range(0, xMax, 0.1).map(x => {
        const y = 0.0382 * x * x - 0.5563 * x + 19.6367;
        return { x, y };
    }).filter(d => d.y >= 0);
    // path 추가
    const curvePath = zoomLayer.append("path")
    .datum(curveData)
    .attr("class", "quadratic-curve")
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "6,4")
    .attr("pointer-events", "stroke")
    .attr("d", quadraticLine);

    const hitboxPath = zoomLayer.append("path")
    .datum(curveData)
    .attr("class", "curve-hitbox")
    .attr("fill", "none")
    .attr("stroke", "transparent")
    .attr("stroke-width", 20)
    .attr("pointer-events", "stroke")
    .attr("d", quadraticLine)
    .on("mouseenter", () => curvePath.classed("hovered", true))
    .on("mouseleave", () => curvePath.classed("hovered", false));

    tippy(hitboxPath.node(), {
    content: `<div style="text-align:center">
                <strong>y = 0.0382x² - 0.5563x + 19.6367</strong><br>
                <span>This is the average fit line.</span>
            </div>`,
    allowHTML: true,
    theme: "no-bg",
    placement: "top",
    animation: "scale",
    inertia: true,
    duration: [0, 0],
    delay: [0, 0],
    followCursor: true,
    offset: [0, 10],
    trigger: "mouseenter focus",
    });


    d3.select(".refresh-btn").remove();

    svg.append("foreignObject")
    .attr("x", width - 30)
    .attr("y", -30)
    .attr("width", 100)
    .attr("height", 40)
    .append("xhtml:button")
    .attr("class", "refresh-btn")
    .style("width", "40px")
    .style("height", "26px")
    .style("font-size", "12px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("background", "#f5f5f5")
    .style("cursor", "pointer")
    .text("↻")
    .on("click", () => {
        location.reload();
    });

    return { svg, zoomLayer, xScale, yScale, width, height };
        

}
