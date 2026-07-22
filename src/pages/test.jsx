<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

    <div className="relative w-full md:max-w-md">
        <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <Input
            placeholder="Search by plan name or code..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
        />
    </div>

    <div className="flex items-center gap-2">

        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[380px] space-y-5">

                <div>
                    <h4 className="font-semibold">Filters</h4>
                    <p className="text-sm text-slate-500">
                        Filter your subscription history.
                    </p>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label>Status</Label>

                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="ALL">
                                All Status
                            </SelectItem>

                            <SelectItem value="ACTIVE">
                                Active
                            </SelectItem>

                            <SelectItem value="EXPIRED">
                                Expired
                            </SelectItem>

                            <SelectItem value="CANCELLED">
                                Cancelled
                            </SelectItem>

                            <SelectItem value="PENDING">
                                Pending
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Plan */}
                <div className="space-y-2">
                    <Label>Subscription Plan</Label>

                    <Select
                        value={planId}
                        onValueChange={setPlanId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Plan" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="ALL">
                                All Plans
                            </SelectItem>

                            {plans.map((plan) => (
                                <SelectItem
                                    key={plan._id}
                                    value={plan._id}
                                >
                                    {plan.planName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Subscription Date */}
                <div className="space-y-2">
                    <Label>Subscription Date</Label>

                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={subscriptionDateFrom}
                            onChange={(e) =>
                                setSubscriptionDateFrom(e.target.value)
                            }
                        />

                        <Input
                            type="date"
                            value={subscriptionDateTo}
                            onChange={(e) =>
                                setSubscriptionDateTo(e.target.value)
                            }
                        />
                    </div>
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                    <Label>Expiration Date</Label>

                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={expirationDateFrom}
                            onChange={(e) =>
                                setExpirationDateFrom(e.target.value)
                            }
                        />

                        <Input
                            type="date"
                            value={expirationDateTo}
                            onChange={(e) =>
                                setExpirationDateTo(e.target.value)
                            }
                        />
                    </div>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                    <Label>Sort By</Label>

                    <Select
                        value={sortBy}
                        onValueChange={setSortBy}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>

                            <SelectItem value="subscriptionDate_desc">
                                Newest Subscription
                            </SelectItem>

                            <SelectItem value="subscriptionDate_asc">
                                Oldest Subscription
                            </SelectItem>

                            <SelectItem value="expirationDate_desc">
                                Expiration ↓
                            </SelectItem>

                            <SelectItem value="expirationDate_asc">
                                Expiration ↑
                            </SelectItem>

                            <SelectItem value="price_desc">
                                Highest Price
                            </SelectItem>

                            <SelectItem value="price_asc">
                                Lowest Price
                            </SelectItem>

                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-between pt-2">

                    <Button
                        variant="outline"
                        onClick={() => {
                            setStatusFilter('ALL')
                            setPlanId('ALL')

                            setSubscriptionDateFrom('')
                            setSubscriptionDateTo('')

                            setExpirationDateFrom('')
                            setExpirationDateTo('')

                            setSortBy('subscriptionDate_desc')
                        }}
                    >
                        Reset
                    </Button>

                    <Button onClick={fetchSubscriptions}>
                        Apply Filters
                    </Button>

                </div>

            </PopoverContent>
        </Popover>

        <Button onClick={fetchSubscriptions}>
            Search
        </Button>

    </div>

</div>