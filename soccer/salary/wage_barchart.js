function renderBarChart(playerData) {
    const containerWidth = document.getElementById("chart-area").clientWidth;
    const svgWidth = 1500;
    const svgHeight = 600;
    const margin = { top: 40, right: 20, bottom: 100, left: 120 };
    const { top, right, bottom, left } = margin;
    const width = svgWidth - left - right;
    const height = svgHeight - top - bottom;
    const totalPlayers = playerData.length;

    d3.select("#chart-area").select("svg").remove();

    

    const svg = d3.select(".chart-container")
        .append("svg")
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const zoomLayer = svg.append("g").attr("class", "zoom-layer");
    const clipId = "chart-clip";

    svg.append("defs")
        .append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    zoomLayer.attr("clip-path", `url(#${clipId})`);

    const xScale = d3.scaleBand().padding(0.15);
    const yScale = d3.scaleLinear();
    const wageType = document.getElementById('wage-type-filter').value;
    const wageKey = wageType === "Annual" ? "Annual Wages" : "weekly_wages";
    xScale.domain(playerData.map(d => d.Player)).range([0, width]);
    yScale.domain([0, d3.max(playerData, d => d[wageKey]) * 1.25]).range([height, 0]);
    const minWage = d3.min(playerData, d => d[wageKey]);
    const maxWage = d3.max(playerData, d => d[wageKey]);

    const colorScale = d3.scaleLinear()
        .domain([minWage, maxWage])
        .range(["#FF7F7F", "#B22222"]);


    const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickSize(-width)
    .tickPadding(10)
    .tickFormat(d => {
        // 1000000 단위로 나누고 M 붙이기 (소수점 1자리)
        return (d / 1_000_000).toFixed(1) + "M";
    });

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "16px")
        .style("font-weight", "bold");

    // Add y-axis title
    const yAxisTitle = wageKey === "Annual Wages" ? "Annual Wages ($)" : "Weekly Wages ($)";
    svg.append("text")
        .attr("class", "y-axis-title")
        .attr("x", -height / 2)
        .attr("y", -left + 40)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-weight", "bold")
        .style("font-size", "32px")
        .text(yAxisTitle);

    // Add x-axis
    const xAxisGroup = zoomLayer.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("text")
    .attr("class", "x-axis-title")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("font-size", "32px")
    .text(`Number of Players = ${totalPlayers}`);

    // Add grid lines (y-axis)
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
        .selectAll("line")
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "8,12")
        .attr("opacity", 0.6);

    const bars = zoomLayer.selectAll(".bar")
        .data(playerData, d => d.Player);  // 유일 key로 매핑

    bars.join(
        enter => enter.append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.Player))
            .attr("y", d => yScale(0))  // 처음은 바닥에서
            .attr("width", xScale.bandwidth())
            .attr("height", 0)
            .attr("fill", d => colorScale(d[wageKey]))
            .attr("opacity", 0)
            .attr("rx", 8)
            .attr("ry", 8)
            .call(enter => enter.transition()
                .duration(500)
                .attr("y", d => yScale(d[wageKey]))
                .attr("height", d => height - yScale(d[wageKey]))
                .attr("opacity", 1)
            ),
        update => update.transition()
            .duration(500)
            .attr("x", d => xScale(d.Player))
            .attr("y", d => yScale(d[wageKey]))
            .attr("height", d => height - yScale(d[wageKey]))
            .attr("width", xScale.bandwidth())
            .attr("fill", d => colorScale(d[wageKey])),
        exit => exit.transition()
            .duration(300)
            .attr("y", yScale(0))
            .attr("height", 0)
            .attr("opacity", 0)
            .remove()
    );


    zoomLayer.selectAll(".hitbox")
    .data(playerData)
    .enter()
    .append("rect")
    .attr("class", "hitbox")
    .attr("x", d => xScale(d.Player))
    .attr("y", 0)
    .attr("width", xScale.bandwidth())
    .attr("height", height)
    .attr("fill", "transparent")
    .attr("tabindex", -1) 
    .style("touch-action", "none") 
    .on("mousedown dragstart selectstart", (event) => {
      event.preventDefault(); 
    })
    .each(function(d, i) {
        const hitbox = this;
        const bar = d3.select(this.parentNode).selectAll(".bar").filter((_, index) => index === i);

        const tooltipContent = `
            <strong>Name:</strong> ${d.Player}<br>
            <strong>Position:</strong> ${d.position1}${d.position2 ? ', ' + d.position2 : ''}<br>
            <strong>Country:</strong> ${d.country}<br>
            <strong>Annual Wages:</strong> $${d["Annual Wages"].toLocaleString()}<br>
            <strong>Weekly Wages:</strong> $${d["weekly_wages"].toLocaleString()}
        `;
        const tip = tippy(hitbox, {
            content: tooltipContent,
            allowHTML: true,
            placement: "bottom",
            flip: false, 
            popperOptions: {
                modifiers: [
                    {
                        name: 'preventOverflow',
                        options: {
                            boundary: 'viewport'
                        },
                    },
                    {
                        name: 'flip',
                        enabled: false,
                    },
                ],
            },
            animation: "scale",
            theme: "light-border",
            arrow: true,
            duration: [150, 150],
            delay: [50, 0],
            inertia: true,
        });

        d3.select(hitbox)
            .on("mouseenter", () => {
                bar.transition().duration(150).attr("fill", "#FFD700").attr("opacity", 1.0);
                tip.show();
            })
            .on("mouseleave", () => {
                bar.transition().duration(150).attr("fill", d => colorScale(d[wageKey])).attr("opacity", 0.9);
                tip.hide();
            });
    });

    const maxImageSize = 80;
    const minImageSize = 20;
    const barWidth = xScale.bandwidth();
    const imageSize = Math.max(minImageSize, Math.min(maxImageSize, barWidth * 0.8));

    // Add player images
    const images = zoomLayer.selectAll(".player-image")
        .data(playerData, d => d.Player);

    images.join(
        enter => enter.append("image")
            .attr("class", "player-image")
            .attr("href", d => d.image || "./薪资可视化图_js/smile.jpg")
            .attr("y", d => yScale(d[wageKey]) - imageSize - 10)
            .attr("x", d => xScale(d.Player) + (barWidth / 2) - (imageSize / 2))
            .attr("width", imageSize)
            .attr("height", imageSize)
            .attr("opacity", 0)
            .call(enter => enter.transition().duration(500)
                .attr("opacity", 1)),
        update => update.transition().duration(500)
            .attr("x", d => xScale(d.Player) + (barWidth / 2) - (imageSize / 2))
            .attr("y", d => yScale(d[wageKey]) - imageSize - 10)
            .attr("width", imageSize)
            .attr("height", imageSize),
        exit => exit.transition().duration(300)
            .attr("opacity", 0)
            .remove()
    );

    const zoom = d3.zoom()
        .scaleExtent([1, 50])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", (event) => {
            const transform = event.transform;
            const newXScale = transform.rescaleX(d3.scaleLinear().domain([0, playerData.length]).range([0, width]));

            zoomLayer.select(".x-axis")
                .transition().duration(100)
                .call(d3.axisBottom(newXScale)
                    .tickFormat((d, i) => playerData[Math.floor(d)]?.Player || "")
                    .tickValues(newXScale.ticks(playerData.length).filter(d => d < playerData.length)));

            zoomLayer.selectAll(".bar")
                .transition().duration(100)
                .attr("x", (d, i) => newXScale(i))
                .attr("width", newXScale(1) - newXScale(0));

            zoomLayer.selectAll(".hitbox")
                .transition().duration(100)
                .attr("x", (d, i) => newXScale(i))
                .attr("width", newXScale(1) - newXScale(0));

            // ** 이미지 위치 갱신 **
            const maxImageSize = 80;
            const minImageSize = 20;
            const imageSize = Math.max(minImageSize, Math.min(maxImageSize, (newXScale(1) - newXScale(0)) * 0.8));

            zoomLayer.selectAll(".player-image")
                .transition().duration(100)
                .attr("x", (d, i) => newXScale(i) + ((newXScale(1) - newXScale(0)) / 2) - (imageSize / 2))
                .attr("width", imageSize)
                .attr("height", imageSize);
        });

    zoomLayer.call(zoom);
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
        renderBarChart(playerData);
    });
}
